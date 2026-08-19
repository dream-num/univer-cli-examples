import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const exampleRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = resolve(exampleRoot, "dist/index.js");
const repositoryRoot = resolve(exampleRoot, "../..");

describe("univer-quick-start", () => {
  it("finds and shows a Facade symbol through the built CLI", async () => {
    const found = await run("api", "find", "--unit", "sheet", "setValues");
    expect(found).toContain("FRange.setValues");
    expect(found).not.toContain("FSlideTableBuilder.setValues");

    const shown = await run("api", "show", "FRange.setValues");
    expect(shown).toContain("FRange.setValues");
    expect(shown).toContain("setValues");
  });

  it("runs the documented workspace command with Commander options", async () => {
    const pnpmEntrypoint = process.env.npm_execpath;
    expect(pnpmEntrypoint).toBeTruthy();
    if (!pnpmEntrypoint) return;

    const result = await execFileAsync(process.execPath, [
      pnpmEntrypoint,
      "example:quick-start",
      "api",
      "find",
      "--unit",
      "sheet",
      "setValues",
    ], {
      cwd: repositoryRoot,
    });

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("FRange.setValues");
    expect(result.stdout).not.toContain("FSlideTableBuilder.setValues");
  }, 30_000);
});

async function run(...args: readonly string[]): Promise<string> {
  const result = await execFileAsync(process.execPath, [entrypoint, ...args]);
  expect(result.stderr).toBe("");
  return result.stdout;
}
