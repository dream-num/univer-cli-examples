import { execFile } from "node:child_process";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const exampleRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = join(exampleRoot, "dist/index.js");

describe("univer-mini", () => {
  it("creates, edits, inspects, exports, and imports a workbook through the built CLI", async () => {
    const directory = await mkdtemp(join(tmpdir(), "univer-mini-"));
    const unitFile = join(directory, "report.unit.json");
    const xlsxFile = join(directory, "report.xlsx");
    const importedFile = join(directory, "imported.unit.json");

    const created = await run("create", "sheet", unitFile, "--name", "Agent report");
    expect(created).toMatchObject({ file: unitFile, unitType: "sheet" });

    const executed = await run(
      "execute",
      unitFile,
      "--code",
      'workbook.getActiveSheet().getRange("A1:B2").setValues([["Name", "Value"], ["Total", 42]]); return "updated";',
    );
    expect(executed).toMatchObject({ saved: true, unitType: "sheet", value: "updated" });

    const inspected = await run("inspect", unitFile, "range", "A1:B2", "--worksheet", "index:1");
    expect(inspected).toMatchObject({
      kind: "worksheet-range",
      ranges: [
        {
          displayValues: [
            ["Name", "Value"],
            ["Total", "42"],
          ],
        },
      ],
    });

    const exported = await run("export", unitFile, xlsxFile);
    expect(exported).toMatchObject({ format: "xlsx", output: xlsxFile });
    expect((await stat(xlsxFile)).isFile()).toBe(true);

    const imported = await run("import", xlsxFile, importedFile);
    expect(imported).toMatchObject({ source: xlsxFile, unitType: "sheet" });
    const workbook = await run("inspect", importedFile, "workbook");
    expect(workbook).toMatchObject({ kind: "workbook" });

    const api = await run("api", "find", "setValues", "--unit", "sheet", "--limit", "3");
    expect(api).toEqual([
      expect.objectContaining({
        matches: expect.arrayContaining([expect.objectContaining({ label: "FRange.setValues" })]),
      }),
    ]);

    const persisted = JSON.parse(await readFile(unitFile, "utf8")) as {
      readonly format: string;
      readonly version: number;
    };
    expect(persisted).toMatchObject({ format: "univer-mini/local-office-unit", version: 1 });
  }, 60_000);

  it.each([
    { extension: "docx", inspection: "document", type: "doc" },
    { extension: "pptx", inspection: "presentation", type: "slide" },
  ])(
    "round-trips an empty $type Unit through $extension",
    async ({ extension, inspection, type }) => {
      const directory = await mkdtemp(join(tmpdir(), `univer-mini-${type}-`));
      const unitFile = join(directory, `${type}.unit.json`);
      const officeFile = join(directory, `${type}.${extension}`);
      const importedFile = join(directory, `${type}-imported.unit.json`);

      await run("create", type, unitFile);
      await run("export", unitFile, officeFile);
      await run("import", officeFile, importedFile);
      const result = await run("inspect", importedFile, inspection);

      expect(result).toMatchObject({ kind: inspection });
      expect((await stat(officeFile)).isFile()).toBe(true);
    },
    30_000,
  );
});

async function run(...args: readonly string[]): Promise<unknown> {
  const result = await execFileAsync(process.execPath, ["--import=tsx", entrypoint, ...args], {
    env: { ...process.env, UNIVER_LICENSE: process.env.UNIVER_LICENSE ?? "" },
    maxBuffer: 10 * 1024 * 1024,
  });
  expect(result.stderr).toBe("");
  return JSON.parse(result.stdout) as unknown;
}
