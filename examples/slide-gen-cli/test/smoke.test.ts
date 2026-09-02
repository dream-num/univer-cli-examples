import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { WorktreeClient } from "@univerjs-pro/collaboration-worktree-client";
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

it("exposes a Slide-only CLI and exports trunk and Worktree revisions as PPTX", async () => {
  const topLevelHelp = await run("--help");
  expect(topLevelHelp).toContain("slide-gen-cli");
  expect(topLevelHelp).not.toContain("import ");

  const createHelp = await run("create", "--help");
  expect(createHelp).toContain("Create a collaborative Slide");
  expect(createHelp).not.toContain("<type>");
  await expect(runResult("import", "deck.pptx")).rejects.toMatchObject({
    stderr: expect.stringContaining("unknown command 'import'"),
  });

  server = await startServer(":memory:");
  temporaryRoot = await mkdtemp(join(tmpdir(), "slide-gen-export-"));
  const unitId = (await run("create", "--name", "Export Slide")).trim();
  const worktreeId = (await run("worktree", "create", "--unit", unitId)).trim();
  await run(
    "execute",
    "--unit",
    unitId,
    "--worktree",
    worktreeId,
    "--code",
    'presentation.setName("Worktree Slide"); return presentation.getName();',
  );

  const invalid = join(temporaryRoot, "deck.docx");
  await expect(runResult("export", invalid, "--unit", unitId, "--trunk")).rejects.toMatchObject({
    stderr: expect.stringContaining("Slide export file must end in .pptx"),
  });

  const trunk = join(temporaryRoot, "trunk.pptx");
  const worktree = join(temporaryRoot, "worktree.pptx");
  await run("export", trunk, "--unit", unitId, "--trunk");
  await run("export", worktree, "--unit", unitId, "--worktree", worktreeId);
  for (const file of [trunk, worktree]) {
    const bytes = await readFile(file);
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
    expect(bytes.length).toBeGreaterThan(1_000);
  }

  expect(
    JSON.parse(await run("inspect", "presentation", "--unit", unitId, "--trunk", "--json")),
  ).toMatchObject({ name: "Export Slide" });
  expect(
    JSON.parse(
      await run("inspect", "presentation", "--unit", unitId, "--worktree", worktreeId, "--json"),
    ),
  ).toMatchObject({ name: "Worktree Slide" });
  expect(await readFile(trunk)).not.toEqual(await readFile(worktree));

  const client = new WorktreeClient({ origin: server.origin });
  expect(JSON.parse(await run("worktree", "ready", worktreeId))).toMatchObject({ status: "ready" });
  expect(await client.reopenWorktree(worktreeId)).toMatchObject({ status: "draft" });
  await client.markReady(worktreeId);
  expect(await client.mergeWorktree(worktreeId)).toMatchObject({ status: "merged" });

  const discardedId = (await run("worktree", "create", "--unit", unitId)).trim();
  expect(await client.discardWorktree(discardedId)).toMatchObject({ status: "discarded" });
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

  const unitId = (await run("create", "--name", "产品发布状态")).trim();
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
