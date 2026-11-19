#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import Database from "libsql";
import { SQLiteDatabaseAdapter } from "@univerjs-pro/collaboration-database-sqlite";
import { UniverCollabEndpoint } from "@univerjs-pro/collaboration-endpoint";
import { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { UnitRepository } from "./unit-repository.js";
import { createUnitRouter } from "./unit-routes.js";
import { UnitService } from "./unit-service.js";

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
  const directory = new Database(databaseFile);
  const collabService = new UniverCollabService({ dbAdapter: database });
  const endpoint = new UniverCollabEndpoint(collabService);
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
  const repository = new UnitRepository(directory);
  const units = new UnitService(collabService, repository, DEMO_USER_ID);
  app.use("/api/units", createUnitRouter(units));

  const webRoot = fileURLToPath(new URL("../web", import.meta.url));
  app.use(express.static(webRoot));
  app.get("/{*path}", (_request, response) => response.sendFile("index.html", { root: webRoot }));

  const server = createServer(app);
  transport.attach(server);
  await listen(server, 3010);
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Server did not start");

  return {
    origin: `http://127.0.0.1:${String(address.port)}`,
    async close(): Promise<void> {
      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      await transport.dispose();
      await closed;
      await collabService.dispose();
      await database.dispose();
      directory.close();
    },
  };
}

async function listen(server: Server, port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await startServer();
  process.stdout.write(`${server.origin}\n`);

  await new Promise<void>((resolve) => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });

  await server.close();
}
