import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
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

it("keeps 01 and adds screenshots for Sheet, Doc, and Slide", async () => {
  server = await startServer(":memory:");
  const created = JSON.parse(await run("create", "sheet", "--name", "Demo Sheet")) as {
    readonly unitId: string;
  };
  const sheetId = created.unitId;

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

  const document = JSON.parse(await run("create", "doc", "--name", "Demo Doc")) as {
    readonly unitId: string;
  };
  expect(
    JSON.parse(await run("inspect", "document", "--unit", document.unitId, "--json")),
  ).toMatchObject({ kind: "document", title: "Demo Doc" });
  expect(
    JSON.parse(
      await run(
        "execute",
        "--unit",
        document.unitId,
        "--code",
        'await api.executeCommand("doc.mutation.rename-doc", { unitId: doc.getId(), name: "Updated Doc" }); return doc.getName();',
      ),
    ),
  ).toMatchObject({ commit: "confirmed", revision: 2, value: "Updated Doc" });
  expect(
    JSON.parse(await run("inspect", "document", "--unit", document.unitId, "--json")),
  ).toMatchObject({ title: "Updated Doc" });

  const presentation = JSON.parse(await run("create", "slide", "--name", "Demo Slide")) as {
    readonly unitId: string;
  };
  expect(
    JSON.parse(await run("inspect", "presentation", "--unit", presentation.unitId, "--json")),
  ).toMatchObject({ kind: "presentation", name: "Demo Slide" });
  expect(
    JSON.parse(
      await run(
        "execute",
        "--unit",
        presentation.unitId,
        "--code",
        'presentation.setName("Updated Slide"); return presentation.getName();',
      ),
    ),
  ).toMatchObject({ commit: "confirmed", revision: 2, value: "Updated Slide" });

  for (const unitId of [sheetId, document.unitId, presentation.unitId]) {
    const url = await run("open", "--unit", unitId, "--no-launch");
    const page = await (await fetch(url.trim())).text();
    expect(page).toContain('id="sidebar"');
    expect(page).toContain('id="app"');
  }
  expect(await (await fetch(`${server.origin}/api/units`)).json()).toMatchObject([
    { name: "Demo Sheet", unitId: sheetId, unitType: "sheet" },
    { name: "Demo Doc", unitId: document.unitId, unitType: "doc" },
    { name: "Demo Slide", unitId: presentation.unitId, unitType: "slide" },
  ]);
  expect(await run("api", "find", "setValues", "--unit", "sheet")).toContain("FRange.setValues");
  expect(await run("api", "show", "FRange.setValues")).toContain("setValues");

  const output = resolve(root, "dist/test-output");
  const captures = [
    [sheetId, "--sheet", "Data", "--range", "A1:B2"],
    [document.unitId],
    [presentation.unitId, "--pages", "1"],
  ] as const;
  for (const [unitId, ...options] of captures) {
    const screenshot = JSON.parse(
      await run("screenshot", "--unit", unitId, ...options, "--out", output, "--json"),
    ) as { readonly outputs: readonly { readonly location: string }[] };
    const bytes = await readFile(screenshot.outputs[0]!.location);
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  }
}, 180_000);

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
