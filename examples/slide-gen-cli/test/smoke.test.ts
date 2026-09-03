import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { WorktreeClient } from "@univerjs-pro/collaboration-worktree-client";
import { unzipSync } from "fflate";
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

  server = await startServer(":memory:", 0);
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

it("applies page programs with replace, append, and gap rejection semantics", async () => {
  server = await startServer(":memory:", 0);
  temporaryRoot = await mkdtemp(join(tmpdir(), "slide-gen-pages-"));
  const generated = join(temporaryRoot, ".generated");
  await mkdir(generated, { recursive: true });
  const openResourceLibrary = () => createFixtureResourceLibrary(temporaryRoot!);
  const sources = [
    join(root, "authoring/product-release/pages/page-01-status.svg"),
    join(root, "authoring/product-release/pages/page-02-handoff.svg"),
  ];
  const unitId = (await run("create", "--name", "Page transitions")).trim();
  const worktreeId = (await run("worktree", "create", "--unit", unitId)).trim();

  for (const [index, source] of sources.entries()) {
    const page = index + 1;
    const program = join(generated, `page-${page}.js`);
    const compiled = JSON.parse(
      await runInProcess(openResourceLibrary, [
        "compile-svg",
        source,
        "--page",
        String(page),
        "--out",
        program,
        "--estimate-text-size",
        "--json",
      ]),
    );
    expect(compiled).toMatchObject({ page, mode: "replace", warnings: [] });
    const execution = await runResult(
      "execute",
      "--unit",
      unitId,
      "--worktree",
      worktreeId,
      "--file",
      program,
    );
    expect(JSON.parse(execution.stdout)).toMatchObject({ commit: "confirmed" });
    expect(execution.stderr).toMatch(/^$|^\[Shape Facade\]: Failed to update Shape/);
  }

  const beforeReplace = JSON.parse(
    await run("inspect", "slide", "index:2", "--unit", unitId, "--worktree", worktreeId, "--json"),
  );
  const replacementSource = join(temporaryRoot, "replacement.svg");
  const replacementProgram = join(generated, "replacement.js");
  await writeFile(
    replacementSource,
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#0D1426"/><text x="54" y="116" fill="#F7F9FF" font-family="Arial" font-size="40">局部修订完成</text></svg>',
  );
  await runInProcess(openResourceLibrary, [
    "compile-svg",
    replacementSource,
    "--page",
    "1",
    "--out",
    replacementProgram,
    "--estimate-text-size",
    "--json",
  ]);
  expect(
    JSON.parse(
      await run(
        "execute",
        "--unit",
        unitId,
        "--worktree",
        worktreeId,
        "--file",
        replacementProgram,
      ),
    ),
  ).toMatchObject({ commit: "confirmed" });
  expect(
    JSON.parse(
      await run(
        "inspect",
        "slide",
        "index:1",
        "--unit",
        unitId,
        "--worktree",
        worktreeId,
        "--json",
      ),
    ).slides[0].textPreview,
  ).toContain("局部修订完成");
  expect(
    JSON.parse(
      await run(
        "inspect",
        "slide",
        "index:2",
        "--unit",
        unitId,
        "--worktree",
        worktreeId,
        "--json",
      ),
    ),
  ).toEqual(beforeReplace);

  const gapProgram = join(generated, "gap.js");
  await runInProcess(openResourceLibrary, [
    "compile-svg",
    sources[1]!,
    "--page",
    String(sources.length + 2),
    "--out",
    gapProgram,
    "--estimate-text-size",
    "--json",
  ]);
  await expect(
    runResult("execute", "--unit", unitId, "--worktree", worktreeId, "--file", gapProgram),
  ).rejects.toMatchObject({ stderr: expect.stringContaining("out of range") });
  expect(
    JSON.parse(
      await run("inspect", "presentation", "--unit", unitId, "--worktree", worktreeId, "--json"),
    ).slides,
  ).toHaveLength(sources.length);
}, 180_000);

it("authors the Baseline Deck and collects per-page Review Evidence", async () => {
  server = await startServer(":memory:", 0);
  temporaryRoot = await mkdtemp(join(tmpdir(), "univer-slide-smoke-"));
  const taskDirectory = join(temporaryRoot, "product-release");
  const pages = join(taskDirectory, "pages");
  const generated = join(taskDirectory, ".generated");
  const resources = join(taskDirectory, "resources");
  const output = join(taskDirectory, "output");
  await Promise.all([mkdir(pages, { recursive: true }), mkdir(generated, { recursive: true })]);
  const pageFiles = ["page-01-status.svg", "page-02-handoff.svg"];
  await Promise.all(
    pageFiles.map(async (file) =>
      writeFile(
        join(pages, file),
        await readFile(join(root, "authoring/product-release/pages", file), "utf8"),
      ),
    ),
  );

  const downloads: string[] = [];
  const library = createFixtureResourceLibrary(temporaryRoot, (url) => downloads.push(url));
  const openResourceLibrary = () => library;
  const resourceExport = JSON.parse(
    await runInProcess(openResourceLibrary, [
      "resources",
      "export",
      "example-tabler-outline/rocket",
      "--out",
      resources,
      "--json",
    ]),
  );
  expect(resourceExport).toMatchObject({
    exported: [{ handle: "example-tabler-outline/rocket" }],
    failed: [],
  });
  expect(downloads).toEqual(["https://example.test/rocket.svg"]);
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

  const evidence = [];
  let confirmedRevision = 0;
  for (const [index, file] of pageFiles.entries()) {
    const page = index + 1;
    const program = join(generated, `page-${page}.js`);
    const compiled = JSON.parse(
      await runInProcess(openResourceLibrary, [
        "compile-svg",
        join(pages, file),
        "--page",
        String(page),
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
      page,
      mode: "replace",
    });
    expect(compiled.lints).toHaveLength(1);

    const executionResult = await runResult(
      "execute",
      "--unit",
      unitId,
      "--worktree",
      worktreeId,
      "--file",
      program,
    );
    const execution = JSON.parse(executionResult.stdout);
    expect(execution).toMatchObject({ commit: "confirmed" });
    confirmedRevision = execution.revision;

    const inspection = JSON.parse(
      await run(
        "inspect",
        "slide",
        `index:${page}`,
        "--unit",
        unitId,
        "--worktree",
        worktreeId,
        "--json",
      ),
    );
    expect(inspection).toMatchObject({
      kind: "slide",
      slides: [{ index, elementCounts: { images: page === 1 ? 1 : 0 } }],
    });
    const lint = JSON.parse(
      await run(
        "lint",
        "--unit",
        unitId,
        "--worktree",
        worktreeId,
        "--pages",
        String(page),
        "--json",
      ),
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
        String(page),
        "--out",
        output,
        "--json",
      ),
    ) as { readonly outputs: readonly { readonly location: string }[] };
    const bytes = await readFile(screenshot.outputs[0]!.location);
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    evidence.push({ compiled, inspection, lint, screenshot });
  }
  expect(evidence).toHaveLength(pageFiles.length);

  const deck = JSON.parse(
    await run("inspect", "presentation", "--unit", unitId, "--worktree", worktreeId, "--json"),
  );
  expect(deck).toMatchObject({ size: { width: 960, height: 540 } });
  expect(deck.slides).toHaveLength(pageFiles.length);
  const consistency = {
    narrative: deck.slides.map((slide: { textPreview: string }) => slide.textPreview),
    font: "Arial",
    colors: ["#0D1426", "#F7F9FF", "#9AA7C2", "#5CE1E6", "#8B7CFF"],
    resourceStyle: "outline rocket on page 1; no resource required on page 2",
    pageSize: deck.size,
    nativePlacement: "not applicable to Baseline Deck",
  };
  expect(consistency.narrative).toEqual([
    expect.stringContaining("产品发布状态"),
    expect.stringContaining("上线交付清单"),
  ]);
  expect(consistency.pageSize).toEqual({ width: 960, height: 540 });

  expect(JSON.parse(await run("worktree", "ready", worktreeId))).toMatchObject({
    status: "ready",
  });
  const reviewUrl = await run("open", "--unit", unitId, "--worktree", worktreeId, "--no-launch");
  expect(reviewUrl).toContain(`unit=${unitId}&worktree=${worktreeId}`);
  expect(confirmedRevision).toBeGreaterThan(1);

  const exportedPptx = join(temporaryRoot, "baseline-worktree.pptx");
  const exportResult = await runResult(
    "export",
    exportedPptx,
    "--unit",
    unitId,
    "--worktree",
    worktreeId,
  );
  expect(exportResult.stderr).toBe("");
  const entries = Object.keys(unzipSync(await readFile(exportedPptx)));
  expect(entries.filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))).toHaveLength(
    pageFiles.length,
  );
  expect(
    JSON.parse(await run("inspect", "presentation", "--unit", unitId, "--trunk", "--json")).slides,
  ).toHaveLength(1);
}, 180_000);

async function run(...args: readonly string[]): Promise<string> {
  const result = await runResult(...args);
  expect(result.stderr).toMatch(/^$|^\[Shape Facade\]: Failed to update Shape/);
  return result.stdout;
}

async function runResult(...args: readonly string[]) {
  return await execFileAsync(process.execPath, [entrypoint, ...args], {
    env: {
      ...process.env,
      SLIDE_GEN_SERVER_URL: server?.origin,
      UNIVER_LICENSE: process.env["UNIVER_LICENSE"] ?? "",
    },
  });
}
