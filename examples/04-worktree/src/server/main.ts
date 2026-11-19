#!/usr/bin/env node

import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import express from "express";
import Database from "libsql";
import { SQLiteDatabaseAdapter } from "@univerjs-pro/collaboration-database-sqlite";
import {
  MemorySessionTicketStore,
  UniverCollabEndpoint,
} from "@univerjs-pro/collaboration-endpoint";
import { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { ErrorCode, type IAllowedRequest } from "@univerjs/protocol";
import { SQLiteWorktreeDatabaseAdapter } from "@univerjs-pro/collaboration-worktree-database-sqlite";
import { UniverCollabWorktreeEndpoint } from "@univerjs-pro/collaboration-worktree-endpoint";
import { UniverCollabWorktreeService } from "@univerjs-pro/collaboration-worktree-service";
import { DEFAULT_SERVER_URL } from "../shared/urls.js";
import { UnitRepository } from "./unit-repository.js";
import { createUnitRouter } from "./unit-routes.js";
import { UnitService } from "./unit-service.js";
import { WorktreeRepository } from "./worktree-repository.js";
import { createWorktreeRouter } from "./worktree-routes.js";

const DEMO_USER_ID = "worktree-user";

const databaseFile = ".data/worktree-demo.sqlite";
await mkdir(".data", { recursive: true });
const database = new SQLiteDatabaseAdapter({ filename: databaseFile });
const worktreeDatabase = new SQLiteWorktreeDatabaseAdapter({ filename: databaseFile });
const directory = new Database(databaseFile);
const collabService = new UniverCollabService({ dbAdapter: database });
const worktreeService = new UniverCollabWorktreeService({
  trunk: { service: collabService, dbAdapter: database },
  dbAdapter: worktreeDatabase,
});
const ticketStore = new MemorySessionTicketStore();
const endpoint = new UniverCollabEndpoint(collabService, { ticketStore });
const worktreeEndpoint = new UniverCollabWorktreeEndpoint(worktreeService, { ticketStore });
const transport = createNodeTransport();

transport.use(async (context, next) => {
  context.userID = DEMO_USER_ID;
  await next();
});
for (const collabEndpoint of [endpoint, worktreeEndpoint]) {
  collabEndpoint.use("connect", async (context, next) => {
    context.member.name = "Worktree User";
    await next();
  });
  transport.register(collabEndpoint);
}

const app = express();
// The example has one demo user with access to every requested action.
app.post("/universer-api/authz/-/object/-/batch_allowed", express.json(), (request, response) => {
  const { requests } = request.body as { requests: IAllowedRequest[] };
  response.json({
    error: { code: ErrorCode.OK, message: "" },
    objectActions: requests.map(({ unitID, objectID, actions }) => ({
      unitID,
      objectID,
      actions: actions.map((action) => ({ action, allowed: true })),
    })),
  });
});

const repository = new UnitRepository(directory);
const units = new UnitService(collabService, repository, DEMO_USER_ID);
app.use("/api/units", createUnitRouter(units));

const worktrees = new WorktreeRepository(directory);
app.use("/api/worktrees", createWorktreeRouter(worktrees));

const webRoot = fileURLToPath(new URL("../web", import.meta.url));
app.use(express.static(webRoot));
app.get("/{*path}", (_request, response) => response.sendFile("index.html", { root: webRoot }));

const server = createServer(app);
transport.attach(server);
const { hostname, port } = new URL(DEFAULT_SERVER_URL);
server.listen(Number(port), hostname, () => console.log(DEFAULT_SERVER_URL));

let shuttingDown = false;
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    const httpServerClosed = once(server, "close");
    server.close();
    await transport.dispose();
    await httpServerClosed;

    await worktreeService.dispose();
    await collabService.dispose();
    await worktreeDatabase.dispose();
    await database.dispose();
    await ticketStore.dispose();
    directory.close();
  } catch (error) {
    console.error("Failed to shut down the server", error);
    process.exitCode = 1;
  }
}
