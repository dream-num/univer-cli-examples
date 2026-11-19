#!/usr/bin/env node

import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import express from "express";
import Database from "libsql";
import { SQLiteDatabaseAdapter } from "@univerjs-pro/collaboration-database-sqlite";
import { UniverCollabEndpoint } from "@univerjs-pro/collaboration-endpoint";
import { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { DEFAULT_SERVER_URL } from "../shared/urls.js";
import { UnitRepository } from "./unit-repository.js";
import { createUnitRouter } from "./unit-routes.js";
import { UnitService } from "./unit-service.js";

const DEMO_USER_ID = "visual-inspection-user";

const databaseFile = ".data/visual-inspection-v2.sqlite";
await mkdir(".data", { recursive: true });
const database = new SQLiteDatabaseAdapter({ filename: databaseFile });
const directory = new Database(databaseFile);
const collabService = new UniverCollabService({ dbAdapter: database });
const endpoint = new UniverCollabEndpoint(collabService);
const transport = createNodeTransport();

transport.use(async (context, next) => {
  context.userID = DEMO_USER_ID;
  await next();
});
endpoint.use("connect", async (context, next) => {
  context.member.name = "Visual Inspection User";
  await next();
});
transport.register(endpoint);

const app = express();
const repository = new UnitRepository(directory);
const units = new UnitService(collabService, repository, DEMO_USER_ID);
app.use("/api/units", createUnitRouter(units));

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

    await collabService.dispose();
    await database.dispose();
    directory.close();
  } catch (error) {
    console.error("Failed to shut down the server", error);
    process.exitCode = 1;
  }
}
