import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, it } from "vitest";
import { createFixtureResourceLibrary, ROCKET_SVG } from "./resource-fixture.js";
import { runInProcess } from "./run-program.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let temporaryRoot: string | undefined;

afterEach(async () => {
  if (temporaryRoot !== undefined) await rm(temporaryRoot, { force: true, recursive: true });
  temporaryRoot = undefined;
});

it("keeps slide navigation outside the review mutation lock", async () => {
  const source = await readFile(join(root, "src/web/main.ts"), "utf8");
  expect(source).not.toMatch(/\bapp\.inert\s*=/);
  expect(source).toContain("lockEditorMutation(app");
  expect(source).toContain("slide-thumbnail-item");
});

it("finds and exports the canonical resource through an injected library", async () => {
  temporaryRoot = await mkdtemp(join(tmpdir(), "univer-resource-test-"));
  const downloads: string[] = [];
  const library = createFixtureResourceLibrary(temporaryRoot, (url) => downloads.push(url));
  const openResourceLibrary = () => library;

  const found = await runInProcess(openResourceLibrary, ["resources", "find", "rocket", "--json"]);
  expect(JSON.parse(found)).toMatchObject({
    total: 1,
    resources: [{ handle: "example-tabler-outline/rocket" }],
  });

  const authoring = join(temporaryRoot, "authoring");
  const destination = join(authoring, "resources");
  const exported = await runInProcess(openResourceLibrary, [
    "resources",
    "export",
    "example-tabler-outline/rocket",
    "--out",
    destination,
    "--json",
  ]);
  expect(JSON.parse(exported)).toMatchObject({
    exported: [{ handle: "example-tabler-outline/rocket" }],
    failed: [],
  });
  expect(await readFile(join(destination, "example-tabler-outline--rocket.svg"), "utf8")).toBe(
    ROCKET_SVG,
  );
  expect(downloads).toEqual(["https://example.test/rocket.svg"]);

  const source = join(authoring, "pages/page-01-status.svg");
  const generated = join(temporaryRoot, "page.js");
  await mkdir(dirname(source), { recursive: true });
  await writeFile(source, await readFile(join(root, "authoring/pages/page-01-status.svg"), "utf8"));
  const compiled = JSON.parse(
    await runInProcess(openResourceLibrary, [
      "compile-svg",
      source,
      "--page",
      "1",
      "--out",
      generated,
      "--estimate-text-size",
      "--json",
    ]),
  ) as Record<string, unknown>;
  expect(compiled).toMatchObject({
    viewport: { width: 960, height: 540 },
    textMeasure: "builtin-estimate",
    warnings: [],
    mode: "replace",
    page: 1,
    out: generated,
  });
  expect(compiled.lints).toEqual([
    "text boxes were sized by estimation (--estimate-text-size), not by real font metrics: text can sit off-position, especially centred or right-aligned lines; recompile without the flag (with a browser) before you ship",
  ]);
  expect((await readFile(generated, "utf8")).length).toBeGreaterThan(100);

  await rm(join(destination, "example-tabler-outline--rocket.svg"));
  await expect(
    runInProcess(openResourceLibrary, [
      "compile-svg",
      source,
      "--page",
      "1",
      "--out",
      generated,
      "--estimate-text-size",
      "--json",
    ]),
  ).rejects.toThrow(/example-tabler-outline--rocket\.svg/);
});
