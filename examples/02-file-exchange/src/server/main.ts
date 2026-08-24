#!/usr/bin/env node

import { startServer } from "./server.js";

const server = await startServer();
process.stdout.write(`${server.origin}\n`);

await new Promise<void>((resolve) => {
  process.once("SIGINT", resolve);
  process.once("SIGTERM", resolve);
});

await server.close();
