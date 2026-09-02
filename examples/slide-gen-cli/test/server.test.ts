import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { startServer, type DemoServer } from "../src/server/server.js";

let server: DemoServer | undefined;
let temporaryRoot: string | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
  if (temporaryRoot !== undefined) await rm(temporaryRoot, { force: true, recursive: true });
  temporaryRoot = undefined;
});

it("creates only empty Slide units and keeps unit and Worktree routes available", async () => {
  temporaryRoot = await mkdtemp(join(tmpdir(), "slide-gen-server-"));
  server = await startServer(join(temporaryRoot, "server.sqlite"), 0);

  const unnamed = await create({});
  expect(unnamed).toMatchObject({ name: "Untitled Slide", unitType: "slide", revision: 1 });

  const named = await create({ unitId: "named-slide", name: "Named Slide" });
  expect(named).toMatchObject({ unitId: "named-slide", name: "Named Slide", unitType: "slide" });

  const legacy = await create({
    unitId: "legacy-input",
    name: "Still a Slide",
    type: "sheet",
    data: { id: "forged-sheet", sheets: { sheet1: {} } },
  });
  expect(legacy).toMatchObject({
    unitId: "legacy-input",
    name: "Still a Slide",
    unitType: "slide",
  });

  expect(await getJson("/api/units/named-slide")).toEqual({
    unitId: "named-slide",
    name: "Named Slide",
    unitType: "slide",
  });
  expect(await getJson("/api/units")).toEqual([
    expect.objectContaining({ unitType: "slide" }),
    expect.objectContaining({ unitType: "slide" }),
    expect.objectContaining({ unitType: "slide" }),
  ]);
  expect(await getJson("/api/worktrees")).toEqual([]);
});

async function create(body: object): Promise<Record<string, unknown>> {
  const response = await fetch(`${server!.origin}/api/units`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as Record<string, unknown>;
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${server!.origin}${path}`);
  expect(response.status).toBe(200);
  return await response.json();
}
