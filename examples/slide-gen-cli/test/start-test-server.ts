import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { onTestFinished } from "vitest";

export async function startTestServer() {
  const directory = await mkdtemp(join(tmpdir(), "slide-gen-"));
  const entrypoint = fileURLToPath(new URL("../dist/server/main.js", import.meta.url));
  const server = spawn(process.execPath, [entrypoint], {
    cwd: directory,
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "inherit"],
  });
  const closed = once(server, "close");
  onTestFinished(async () => {
    server.kill("SIGTERM");
    try {
      await closed;
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  const lines = createInterface({ input: server.stdout });
  const { value: origin } = await lines[Symbol.asyncIterator]().next();
  if (!origin) throw new Error("Slide server exited before reporting its URL");
  return { origin, directory };
}
