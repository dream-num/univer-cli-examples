import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, expect, it } from "vitest";
import { startServer, type DemoServer } from "../src/server/server.js";
import { createUniverRenderRuntime } from "@univer-cli/univer-render-runtime";
import type { ISlideData } from "@univerjs-pro/slides";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { loadRuntime } from "../src/cli/features/unit-content.js";

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = join(root, "dist/cli/main.js");
const fixture = join(root, "test/fixtures/native");
let server: DemoServer | undefined;
let temporaryRoot: string | undefined;

afterEach(async () => {
  await server?.close();
  if (temporaryRoot !== undefined) await rm(temporaryRoot, { force: true, recursive: true });
  server = undefined;
  temporaryRoot = undefined;
});

it("replays native chart and table after full-page replacement", async () => {
  server = await startServer(":memory:", 0);
  temporaryRoot = await mkdtemp(join(tmpdir(), "slide-native-"));
  const program = join(temporaryRoot, "page.js");
  await mkdir(dirname(program), { recursive: true });
  expect(await readFile(join(fixture, "page.svg"), "utf8")).not.toMatch(
    /\b(?:href|src)=["']https?:/,
  );
  await run(
    "compile-svg",
    join(fixture, "page.svg"),
    "--page",
    "1",
    "--out",
    program,
    "--estimate-text-size",
    "--json",
  );
  const unitId = (await run("create", "--name", "Native fixture")).trim();
  const worktreeId = (await run("worktree", "create", "--unit", unitId)).trim();

  expect(await execute(unitId, worktreeId, program)).toMatchObject({ commit: "confirmed" });
  expect(await execute(unitId, worktreeId, join(fixture, "enhancement.js"))).toMatchObject({
    commit: "confirmed",
    value: { charts: 1, tables: 1 },
  });
  expect(await nativeCounts(unitId, worktreeId)).toEqual({ charts: 1, tables: 1 });
  const inspection = await inspectSlide(unitId, worktreeId);
  expect(inspection.elementCounts).toMatchObject({ charts: 1, tables: 1 });
  const table = inspection.elements.find((element) => element.type === "table");
  const tablePanel = inspection.elements.find(
    (element) =>
      element.type === "shape" && element.transform.left === 580 && element.transform.width === 370,
  );
  expect(table).toMatchObject({ transform: { left: 590, top: 160, width: 360, height: 250 } });
  expect(tablePanel).toBeDefined();
  expect(table!.transform.left).toBeGreaterThanOrEqual(tablePanel!.transform.left);
  expect(table!.transform.left + table!.transform.width).toBeLessThanOrEqual(
    tablePanel!.transform.left + tablePanel!.transform.width,
  );
  expect(table!.transform.left + table!.transform.width).toBeLessThanOrEqual(960);

  expect(await execute(unitId, worktreeId, program)).toMatchObject({ commit: "confirmed" });
  expect(await nativeCounts(unitId, worktreeId)).toEqual({ charts: 0, tables: 0 });
  expect(await inspectionCounts(unitId, worktreeId)).toMatchObject({ charts: 0, tables: 0 });

  expect(await execute(unitId, worktreeId, join(fixture, "enhancement.js"))).toMatchObject({
    commit: "confirmed",
    value: { charts: 1, tables: 1 },
  });
  expect(await nativeCounts(unitId, worktreeId)).toEqual({ charts: 1, tables: 1 });
  expect(await inspectionCounts(unitId, worktreeId)).toMatchObject({ charts: 1, tables: 1 });
  const enhancementSource = await readFile(join(fixture, "enhancement.js"), "utf8");
  expect(enhancementSource).toMatch(/setCategoryField\(0\)[\s\S]*setValueFields\(\[1\]\)/);

  const contentRuntime = await loadRuntime(server.origin, unitId, worktreeId);
  const unitData = (await contentRuntime.exportUnitData()) as ISlideData;
  await contentRuntime.close();
  const renderRuntime = await createUniverRenderRuntime({
    renderPageRoot: fileURLToPath(new URL("../dist/render-page", import.meta.url)),
    license: process.env["UNIVER_LICENSE"] ?? "",
  });
  const rendered = await renderRuntime.render({
    unitType: "slide",
    unitData,
    operation: { kind: "slide-page", page: 1, scale: 1 },
  });
  await renderRuntime.close();
  expect(rendered).toMatchObject({ width: 960, height: 540 });
  expect(Buffer.from(rendered.bytes).subarray(1, 4).toString()).toBe("PNG");

  expect(
    JSON.parse(
      await run("lint", "--unit", unitId, "--worktree", worktreeId, "--pages", "1", "--json"),
    ),
  ).toMatchObject({ findings: [] });
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
      join(temporaryRoot, "screenshots"),
      "--json",
    ),
  );
  expect((await readFile(screenshot.outputs[0].location)).subarray(1, 4).toString()).toBe("PNG");

  expect(JSON.parse(await run("worktree", "ready", worktreeId))).toMatchObject({ status: "ready" });
  const pptx = join(temporaryRoot, "native.pptx");
  const exporterDiagnostics = await runResult(
    "export",
    pptx,
    "--unit",
    unitId,
    "--worktree",
    worktreeId,
  );
  expect(exporterDiagnostics.stderr).not.toMatch(/error|invalid|drop/i);
  const pptxBytes = await readFile(pptx);
  validateNativeExport(enhancementSource, pptxBytes);
  expect(() =>
    validateNativeExport(enhancementSource.replace(".setCategoryField(0)", ""), pptxBytes),
  ).toThrow(/category and value mapping/);
  expect(() =>
    validateNativeExport(
      enhancementSource,
      zipSync({ "ppt/slides/slide1.xml": strToU8("<p:sld/>") }),
    ),
  ).toThrow(/chart XML/);
}, 180_000);

function validateNativeExport(source: string, bytes: Uint8Array): void {
  if (!/setCategoryField\(0\)[\s\S]*setValueFields\(\[1\]\)/.test(source)) {
    throw new Error("Native chart requires category and value mapping");
  }
  const entries = unzipSync(bytes);
  if (!Object.keys(entries).some((name) => /^ppt\/charts\/chart\d+\.xml$/.test(name))) {
    throw new Error("PPTX is missing chart XML");
  }
  if (!Object.keys(entries).some((name) => /^ppt\/embeddings\/.*\.xlsx$/.test(name))) {
    throw new Error("PPTX is missing embedded workbook");
  }
  const slideXml = entries["ppt/slides/slide1.xml"];
  if (slideXml === undefined || !strFromU8(slideXml).includes("<a:tbl>")) {
    throw new Error("PPTX slide XML is missing native table");
  }
}

async function nativeCounts(unitId: string, worktreeId: string) {
  return JSON.parse(
    await run(
      "execute",
      "--unit",
      unitId,
      "--worktree",
      worktreeId,
      "--code",
      "const slide = presentation.getSlideByIndex(0); return { charts: slide.getCharts().length, tables: slide.getTables().length };",
    ),
  ).value;
}

async function execute(unitId: string, worktreeId: string, file: string) {
  return JSON.parse(
    await run("execute", "--unit", unitId, "--worktree", worktreeId, "--file", file),
  );
}

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

async function inspectionCounts(unitId: string, worktreeId: string) {
  return (await inspectSlide(unitId, worktreeId)).elementCounts;
}

async function inspectSlide(unitId: string, worktreeId: string) {
  return JSON.parse(
    await run("inspect", "slide", "index:1", "--unit", unitId, "--worktree", worktreeId, "--json"),
  ).slides[0] as {
    readonly elementCounts: Record<string, number>;
    readonly elements: readonly {
      readonly type: string;
      readonly transform: {
        readonly left: number;
        readonly top: number;
        readonly width: number;
        readonly height: number;
      };
    }[];
  };
}
