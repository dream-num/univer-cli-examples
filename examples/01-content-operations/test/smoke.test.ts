import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, expect, it } from "vitest";
import { startServer, type DemoServer } from "../src/server/server.js";

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = join(root, "dist/cli/main.js");
let server: DemoServer | undefined;

afterEach(async () => await server?.close());

it("creates, inspects, executes, and opens Sheet, Doc, and Slide units", async () => {
  server = await startServer(":memory:");
  const sheetId = (await run("create", "sheet", "--name", "Demo Sheet")).trim();

  const before = await run(
    "inspect",
    "range",
    "A1:B2",
    "--worksheet",
    "index:1",
    "--unit",
    sheetId,
    "--json",
  );
  expect(JSON.parse(before)).toMatchObject({
    ranges: [
      {
        displayValues: [
          ["Name", "Value"],
          ["Initial", "1"],
        ],
      },
    ],
  });

  const execution = JSON.parse(
    await run(
      "execute",
      "--unit",
      sheetId,
      "--code",
      'workbook.getActiveSheet().getRange("A2:B2").setValues([["Updated", 2]]); return "done";',
    ),
  ) as Record<string, unknown>;
  expect(execution).toMatchObject({ commit: "confirmed", revision: 2, value: "done" });

  const documentId = (await run("create", "doc", "--name", "Demo Doc")).trim();
  expect(
    JSON.parse(await run("inspect", "document", "--unit", documentId, "--json")),
  ).toMatchObject({ kind: "document", title: "Demo Doc" });
  expect(
    JSON.parse(
      await run(
        "execute",
        "--unit",
        documentId,
        "--code",
        'await api.executeCommand("doc.mutation.rename-doc", { unitId: doc.getId(), name: "Updated Doc" }); return doc.getName();',
      ),
    ),
  ).toMatchObject({ commit: "confirmed", revision: 2, value: "Updated Doc" });
  expect(
    JSON.parse(await run("inspect", "document", "--unit", documentId, "--json")),
  ).toMatchObject({ title: "Updated Doc" });

  const presentationId = (await run("create", "slide", "--name", "Demo Slide")).trim();
  expect(
    JSON.parse(await run("inspect", "presentation", "--unit", presentationId, "--json")),
  ).toMatchObject({ kind: "presentation", name: "Demo Slide" });
  expect(
    JSON.parse(
      await run(
        "execute",
        "--unit",
        presentationId,
        "--code",
        'presentation.setName("Updated Slide"); return presentation.getName();',
      ),
    ),
  ).toMatchObject({ commit: "confirmed", revision: 2, value: "Updated Slide" });

  for (const unitId of [sheetId, documentId, presentationId]) {
    const url = await run("open", "--unit", unitId, "--no-launch");
    const page = await (await fetch(url.trim())).text();
    expect(page).toContain('id="sidebar"');
    expect(page).toContain('id="app"');
  }
  expect(await (await fetch(`${server.origin}/api/units`)).json()).toMatchObject([
    { name: "Demo Sheet", unitId: sheetId, unitType: "sheet" },
    { name: "Demo Doc", unitId: documentId, unitType: "doc" },
    { name: "Demo Slide", unitId: presentationId, unitType: "slide" },
  ]);
  expect(await run("api", "find", "setValues", "--unit", "sheet")).toContain("FRange.setValues");
  expect(await run("api", "show", "FRange.setValues")).toContain("setValues");
}, 90_000);

it("restores the file list and Unit from SQLite", async () => {
  const directory = await mkdtemp(join(tmpdir(), "univer-content-operations-"));
  const databaseFile = join(directory, "content.sqlite");
  try {
    server = await startServer(databaseFile);
    const unitId = (await run("create", "sheet", "--name", "Persistent")).trim();
    await server.close();
    server = undefined;

    server = await startServer(databaseFile);
    expect(await (await fetch(`${server.origin}/api/units`)).json()).toMatchObject([
      { name: "Persistent", unitId, unitType: "sheet" },
    ]);
    expect(JSON.parse(await run("inspect", "workbook", "--unit", unitId, "--json"))).toMatchObject({
      name: "Persistent",
      unitId,
    });
  } finally {
    await server?.close();
    server = undefined;
    await rm(directory, { recursive: true });
  }
}, 30_000);

async function run(...args: readonly string[]): Promise<string> {
  const result = await execFileAsync(process.execPath, [entrypoint, ...args], {
    env: {
      ...process.env,
      UNIVER_LICENSE: process.env["UNIVER_LICENSE"] ?? "",
    },
  });
  expect(result.stderr).toBe("");
  return result.stdout;
}
