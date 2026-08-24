import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { SQLiteDatabaseAdapter } from "@univerjs-pro/collaboration-database-sqlite";
import { UniverCollabEndpoint } from "@univerjs-pro/collaboration-endpoint";
import {
  UniverCollabService,
  type CreateUnitFromDataInput,
} from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { getSlidesEmptySnapshot } from "@univerjs-pro/slides";
import { LocaleType, type IDocumentData, type IWorkbookData } from "@univerjs/core";
import { parseUnitType, unitTypeLabel, type UnitType } from "../shared/unit.js";
import { UniverType } from "@univerjs/protocol";
import { UnitStore } from "./unit-store.js";

const DEMO_USER_ID = "content-operations-user";

export interface DemoServer {
  readonly origin: string;
  close(): Promise<void>;
}

export async function startServer(
  databaseFile = ".data/content-operations.sqlite",
): Promise<DemoServer> {
  await mkdir(dirname(databaseFile), { recursive: true });
  const database = new SQLiteDatabaseAdapter({ filename: databaseFile });
  const units = new UnitStore(databaseFile);
  const service = new UniverCollabService({ dbAdapter: database });
  const endpoint = new UniverCollabEndpoint(service);
  const transport = createNodeTransport();

  transport.use(async (context, next) => {
    context.userID = DEMO_USER_ID;
    await next();
  });
  endpoint.use("connect", async (context, next) => {
    context.member.name = "Content Operations User";
    await next();
  });
  transport.register(endpoint);

  const app = express();
  app.post("/api/units", express.json(), async (request, response) => {
    const unitId = randomUUID().slice(0, 8);
    const unitType = parseUnitType(request.body.type);
    const name = String(request.body.name ?? `Untitled ${unitTypeLabel(unitType)}`);
    const result = await service.createUnitFromData(createUnitInput(unitType, unitId, name), {
      userID: DEMO_USER_ID,
    });
    const unit = { name, unitId, unitType };
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
  app.use("/universer-api", (request, response) => {
    request.url = request.originalUrl;
    transport.handleRequest(request, response);
  });

  const webRoot = fileURLToPath(new URL("../web", import.meta.url));
  app.use(express.static(webRoot));
  app.get("/{*path}", (_request, response) => response.sendFile("index.html", { root: webRoot }));

  const server = createServer(app);
  server.on("upgrade", (request, socket, head) => transport.handleUpgrade(request, socket, head));
  await listen(server, 3010);
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Server did not start");

  return {
    origin: `http://127.0.0.1:${String(address.port)}`,
    async close(): Promise<void> {
      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      await transport.dispose();
      await closed;
      await service.dispose();
      await database.dispose();
      units.close();
    },
  };
}

function createUnitInput(
  unitType: UnitType,
  unitId: string,
  name: string,
): CreateUnitFromDataInput {
  switch (unitType) {
    case "sheet":
      return { type: UniverType.UNIVER_SHEET, data: createWorkbook(unitId, name) };
    case "doc":
      return { type: UniverType.UNIVER_DOC, data: createDocument(unitId, name) };
    case "slide":
      return {
        type: UniverType.UNIVER_SLIDE,
        data: { ...getSlidesEmptySnapshot(unitId, LocaleType.EN_US, name), rev: 1 },
      };
  }
}

function createWorkbook(unitId: string, name: string): IWorkbookData {
  return {
    id: unitId,
    rev: 1,
    name,
    appVersion: "0.25.0",
    locale: LocaleType.EN_US,
    sheetOrder: ["sheet-1"],
    sheets: {
      "sheet-1": {
        id: "sheet-1",
        name: "Data",
        rowCount: 100,
        columnCount: 20,
        cellData: {
          0: { 0: { v: "Name" }, 1: { v: "Value" } },
          1: { 0: { v: "Initial" }, 1: { v: 1 } },
        },
      },
    },
    styles: {},
    resources: [],
  };
}

function createDocument(unitId: string, name: string): IDocumentData {
  return {
    id: unitId,
    rev: 1,
    title: name,
    body: {
      dataStream: "Start writing\r\n",
      paragraphs: [{ paragraphId: "paragraph-1", startIndex: 13 }],
      sectionBreaks: [{ sectionId: "section-1", startIndex: 14 }],
      textRuns: [],
    },
    documentStyle: {},
    resources: [],
  };
}

async function listen(server: Server, port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
}
