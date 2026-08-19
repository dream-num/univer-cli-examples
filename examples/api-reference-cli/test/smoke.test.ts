import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const exampleRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entrypoint = resolve(exampleRoot, "dist/index.js");

describe("univer-api", () => {
  it("finds and shows a Facade symbol through the built CLI", async () => {
    const found = await run("api", "find", "--unit", "sheet", "setValues");
    expect(found).toContain("FRange.setValues");
    expect(found).not.toContain("FSlideTableBuilder.setValues");

    const shown = await run("api", "show", "FRange.setValues");
    expect(shown).toContain("FRange.setValues");
    expect(shown).toContain("setValues");
  });
});

async function run(...args: readonly string[]): Promise<string> {
  const result = await execFileAsync(process.execPath, [entrypoint, ...args]);
  expect(result.stderr).toBe("");
  return result.stdout;
}
