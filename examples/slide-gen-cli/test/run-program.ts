import type { ResourceLibrary } from "@univer-cli/resource-library";
import type { Command } from "commander";
import { createProgram } from "../src/cli/program.js";

export async function runInProcess(
  openResourceLibrary: () => ResourceLibrary,
  args: readonly string[],
): Promise<string> {
  let output = "";
  const program = createProgram({ openResourceLibrary });
  configureOutput(program);
  await program.parseAsync(["node", "slide-gen-cli", ...args]);
  return output;

  function configureOutput(command: Command): void {
    command.exitOverride();
    command.configureOutput({
      writeOut: (value) => (output += value),
      writeErr: (value) => (output += value),
    });
    for (const child of command.commands) configureOutput(child);
  }
}
