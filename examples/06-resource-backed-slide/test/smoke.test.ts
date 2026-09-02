import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, expect, it } from "vitest";
import { startServer, type DemoServer } from "../src/server/server.js";
import { createFixtureResourceLibrary } from "./resource-fixture.js";
import { runInProcess } from "./run-program.js";

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = join(root, "dist/cli/main.js");
let server: DemoServer | undefined;
let temporaryRoot: string | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
  if (temporaryRoot !== undefined) await rm(temporaryRoot, { force: true, recursive: true });
  temporaryRoot = undefined;
});

it("keeps 02 and edits Sheet, Doc, and Slide through Worktrees", async () => {
  server = await startServer(":memory:");
  const sheetId = (await run("create", "sheet", "--name", "Demo Sheet")).trim();
  const sheetWorktree = (await run("worktree", "create", "--unit", sheetId)).trim();

  const before = await run(
    "inspect",
    "range",
    "A1:B2",
    "--worksheet",
    "index:1",
    "--unit",
    sheetId,
    "--trunk",
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
      "--worktree",
      sheetWorktree,
      "--code",
      'workbook.getActiveSheet().getRange("A2:B2").setValues([["Updated", 2]]); return "done";',
    ),
  ) as Record<string, unknown>;
  expect(execution).toMatchObject({ commit: "confirmed", revision: 2, value: "done" });

  const documentId = (await run("create", "doc", "--name", "Demo Doc")).trim();
  const documentWorktree = (await run("worktree", "create", "--unit", documentId)).trim();
  expect(
    JSON.parse(
      await run(
        "inspect",
        "document",
        "--unit",
        documentId,
        "--worktree",
        documentWorktree,
        "--json",
      ),
    ),
  ).toMatchObject({ kind: "document", title: "Demo Doc" });
  expect(
    JSON.parse(
      await run(
        "execute",
        "--unit",
        documentId,
        "--worktree",
        documentWorktree,
        "--code",
        'await api.executeCommand("doc.mutation.rename-doc", { unitId: doc.getId(), name: "Updated Doc" }); return doc.getName();',
      ),
    ),
  ).toMatchObject({ commit: "confirmed", revision: 2, value: "Updated Doc" });
  expect(
    JSON.parse(
      await run(
        "inspect",
        "document",
        "--unit",
        documentId,
        "--worktree",
        documentWorktree,
        "--json",
      ),
    ),
  ).toMatchObject({ title: "Updated Doc" });

  const presentationId = (await run("create", "slide", "--name", "Demo Slide")).trim();
  const presentationWorktree = (await run("worktree", "create", "--unit", presentationId)).trim();
  expect(
    JSON.parse(
      await run(
        "inspect",
        "presentation",
        "--unit",
        presentationId,
        "--worktree",
        presentationWorktree,
        "--json",
      ),
    ),
  ).toMatchObject({ kind: "presentation", name: "Demo Slide" });
  expect(
    JSON.parse(
      await run(
        "execute",
        "--unit",
        presentationId,
        "--worktree",
        presentationWorktree,
        "--code",
        'presentation.setName("Updated Slide"); return presentation.getName();',
      ),
    ),
  ).toMatchObject({ commit: "confirmed", revision: 2, value: "Updated Slide" });

  for (const unitId of [sheetId, documentId, presentationId]) {
    const url = await run("open", "--unit", unitId, "--trunk", "--no-launch");
    const page = await (await fetch(url.trim())).text();
    expect(page).toContain('id="sidebar"');
    expect(page).toContain('id="app"');
  }
  expect(await (await fetch(`${server.origin}/api/units`)).json()).toMatchObject([
    { name: "Demo Sheet", unitId: sheetId, unitType: "sheet" },
    { name: "Demo Doc", unitId: documentId, unitType: "doc" },
    { name: "Demo Slide", unitId: presentationId, unitType: "slide" },
  ]);
  expect(await (await fetch(`${server.origin}/api/worktrees`)).json()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ worktreeID: sheetWorktree, status: "draft" }),
      expect.objectContaining({ worktreeID: documentWorktree, status: "draft" }),
      expect.objectContaining({ worktreeID: presentationWorktree, status: "draft" }),
    ]),
  );
  expect(await run("api", "find", "setValues", "--unit", "sheet")).toContain("FRange.setValues");
  expect(await run("api", "show", "FRange.setValues")).toContain("setValues");

  const output = resolve(root, "dist/test-output");
  const captures = [
    [sheetId, "--worktree", sheetWorktree, "--sheet", "Data", "--range", "A1:B2"],
    [documentId, "--worktree", documentWorktree],
    [presentationId, "--worktree", presentationWorktree, "--pages", "1"],
  ] as const;
  for (const [unitId, ...options] of captures) {
    const screenshot = JSON.parse(
      await run("screenshot", "--unit", unitId, ...options, "--out", output, "--json"),
    ) as { readonly outputs: readonly { readonly location: string }[] };
    const bytes = await readFile(screenshot.outputs[0]!.location);
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  }
}, 180_000);

it("authors the resource-backed Baseline Slide and collects Review Evidence", async () => {
  server = await startServer(":memory:");
  temporaryRoot = await mkdtemp(join(tmpdir(), "univer-slide-smoke-"));
  const authoring = join(temporaryRoot, "authoring");
  const generated = join(temporaryRoot, ".generated");
  const resources = join(authoring, "resources");
  const source = join(authoring, "page.svg");
  const program = join(generated, "page.js");
  await Promise.all([mkdir(authoring, { recursive: true }), mkdir(generated, { recursive: true })]);
  await writeFile(source, await readFile(join(root, "authoring/page.svg"), "utf8"));

  const library = createFixtureResourceLibrary(temporaryRoot);
  const openResourceLibrary = () => library;
  const exported = JSON.parse(
    await runInProcess(openResourceLibrary, [
      "resources",
      "export",
      "example-tabler-outline/rocket",
      "--out",
      resources,
      "--json",
    ]),
  );
  expect(exported).toMatchObject({
    exported: [{ handle: "example-tabler-outline/rocket" }],
    failed: [],
  });
  const compiled = JSON.parse(
    await runInProcess(openResourceLibrary, [
      "compile-svg",
      source,
      "--page",
      "1",
      "--out",
      program,
      "--estimate-text-size",
      "--json",
    ]),
  );
  expect(compiled).toMatchObject({
    viewport: { width: 960, height: 540 },
    textMeasure: "builtin-estimate",
    warnings: [],
    page: 1,
    mode: "replace",
  });
  expect(compiled.lints).toHaveLength(1);

  const unitId = (await run("create", "slide", "--name", "产品发布状态")).trim();
  const worktreeId = (await run("worktree", "create", "--unit", unitId)).trim();
  const unchanged = JSON.parse(
    await run(
      "execute",
      "--unit",
      unitId,
      "--worktree",
      worktreeId,
      "--code",
      'return "unchanged";',
    ),
  );
  expect(unchanged.commit).not.toBe("confirmed");

  const executionResult = await runResult(
    "execute",
    "--unit",
    unitId,
    "--worktree",
    worktreeId,
    "--file",
    program,
  );
  const failedShapeId = /Shape "([^"]+)"/.exec(executionResult.stderr)?.[1];
  const execution = JSON.parse(executionResult.stdout);
  expect(execution).toMatchObject({ commit: "confirmed" });
  expect(execution.revision).toBeGreaterThan(1);

  const inspection = await run(
    "inspect",
    "slide",
    "index:1",
    "--unit",
    unitId,
    "--worktree",
    worktreeId,
    "--json",
  );
  const inspected = JSON.parse(inspection);
  expect(inspected).toMatchObject({
    kind: "slide",
    slides: [
      {
        elementCounts: { images: 1 },
        textPreview: expect.stringContaining("产品发布状态"),
      },
    ],
  });
  expect(executionResult.stderr).toMatch(/^\[Shape Facade\]: Failed to update Shape "[^"]+"\.\n$/);
  expect(inspected.slides[0].elements).toContainEqual(
    expect.objectContaining({
      id: failedShapeId,
      transform: expect.objectContaining({ left: 0, top: 0, width: 960, height: 540 }),
      fill: expect.objectContaining({ color: "#0D1426" }),
    }),
  );

  const lint = JSON.parse(
    await run("lint", "--unit", unitId, "--worktree", worktreeId, "--pages", "1", "--json"),
  );
  expect(lint).toMatchObject({ findings: [] });

  const screenshot = JSON.parse(
    await run(
      "screenshot",
      "--unit",
      unitId,
      "--worktree",
      worktreeId,
      "--pages",
      "1",
      "--out",
      resolve(root, "output/smoke"),
      "--json",
    ),
  ) as { readonly outputs: readonly { readonly location: string }[] };
  const bytes = await readFile(screenshot.outputs[0]!.location);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");

  expect(JSON.parse(await run("worktree", "ready", worktreeId))).toMatchObject({
    status: "ready",
  });
  expect(await run("open", "--unit", unitId, "--worktree", worktreeId, "--no-launch")).toContain(
    `worktree=${worktreeId}`,
  );
}, 180_000);

async function run(...args: readonly string[]): Promise<string> {
  const result = await runResult(...args);
  expect(result.stderr).toBe("");
  return result.stdout;
}

async function runResult(...args: readonly string[]) {
  return await execFileAsync(process.execPath, [entrypoint, ...args], {
    env: {
      ...process.env,
      UNIVER_LICENSE: process.env["UNIVER_LICENSE"] ?? "",
    },
  });
}
