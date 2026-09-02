import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { SQLiteDatabaseAdapter } from "@univerjs-pro/collaboration-database-sqlite";
import {
  MemorySessionTicketStore,
  UniverCollabEndpoint,
} from "@univerjs-pro/collaboration-endpoint";
import { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { SQLiteWorktreeDatabaseAdapter } from "@univerjs-pro/collaboration-worktree-database-sqlite";
import { UniverCollabWorktreeEndpoint } from "@univerjs-pro/collaboration-worktree-endpoint";
import { UniverCollabWorktreeService } from "@univerjs-pro/collaboration-worktree-service";
import { getSlidesEmptySnapshot } from "@univerjs-pro/slides";
import { LocaleType } from "@univerjs/core";
import { UNIT_TYPE } from "../shared/unit.js";
import { UniverType } from "@univerjs/protocol";
import { UnitStore } from "./unit-store.js";
import { WorktreeStore } from "./worktree-store.js";

const DEMO_USER_ID = "worktree-user";

export interface DemoServer {
  readonly origin: string;
  close(): Promise<void>;
}

export async function startServer(
  databaseFile = ".data/worktree.sqlite",
  port = 3010,
): Promise<DemoServer> {
  await mkdir(dirname(databaseFile), { recursive: true });
  const database = new SQLiteDatabaseAdapter({ filename: databaseFile });
  const worktreeDatabase = new SQLiteWorktreeDatabaseAdapter({ filename: databaseFile });
  const units = new UnitStore(databaseFile);
  const worktrees = new WorktreeStore(databaseFile);
  const service = new UniverCollabService({ dbAdapter: database });
  const worktreeService = new UniverCollabWorktreeService({
    trunk: { service, dbAdapter: database },
    dbAdapter: worktreeDatabase,
  });
  const ticketStore = new MemorySessionTicketStore();
  const endpoint = new UniverCollabEndpoint(service, { ticketStore });
  const worktreeEndpoint = new UniverCollabWorktreeEndpoint(worktreeService, { ticketStore });
  const transport = createNodeTransport();

  for (const event of [
    "worktreeCreated",
    "worktreeUnitAdded",
    "worktreeUnitCreated",
    "worktreeStatusChanged",
    "worktreeUnitMergeResultRecorded",
  ] as const) {
    worktreeService.on(event, ({ worktree }) => worktrees.upsert(worktree));
  }

  transport.use(async (context, next) => {
    context.userID = DEMO_USER_ID;
    await next();
  });
  endpoint.use("connect", async (context, next) => {
    context.member.name = "Worktree User";
    await next();
  });
  worktreeEndpoint.use("connect", async (context, next) => {
    context.member.name = "Worktree User";
    await next();
  });
  transport.register(endpoint);
  transport.register(worktreeEndpoint);

  const app = express();
  app.post("/api/units", express.json(), async (request, response) => {
    const unitId = String(request.body.unitId ?? randomUUID().slice(0, 8));
    const name = String(request.body.name ?? "Untitled Slide");
    const result = await service.createUnitFromData(
      {
        type: UniverType.UNIVER_SLIDE,
        data: { ...getSlidesEmptySnapshot(unitId, LocaleType.EN_US, name), rev: 1 },
      },
      { userID: DEMO_USER_ID },
    );
    const unit = { name, unitId, unitType: UNIT_TYPE };
    units.add(unit);
    response.status(201).json({ ...unit, revision: result.headRevision });
  });
  app.get("/api/units", (_request, response) => {
    response.json(units.list());
  });
  app.get("/api/units/:unitId", (request, response) => {
    const unit = units.get(request.params.unitId);
    if (unit === undefined) {
      response.sendStatus(404);
      return;
    }
    response.json(unit);
  });
  app.get("/api/worktrees", (_request, response) => {
    response.json(worktrees.list());
  });
  app.use("/universer-api", (request, response) => {
    request.url = request.originalUrl;
    transport.handleRequest(request, response);
  });

  const webRoot = fileURLToPath(new URL("../web", import.meta.url));
  app.use(express.static(webRoot));
  app.get("/{*path}", (_request, response) => response.sendFile("index.html", { root: webRoot }));

  const server = createServer(app);
  server.on("upgrade", (request, socket, head) => transport.handleUpgrade(request, socket, head));
  await listen(server, port);
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Server did not start");

  return {
    origin: `http://127.0.0.1:${String(address.port)}`,
    async close(): Promise<void> {
      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      await transport.dispose();
      await closed;
      await worktreeService.dispose();
      await service.dispose();
      await worktreeDatabase.dispose();
      await database.dispose();
      await ticketStore.dispose();
      units.close();
      worktrees.close();
    },
  };
}

async function listen(server: Server, port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
}
