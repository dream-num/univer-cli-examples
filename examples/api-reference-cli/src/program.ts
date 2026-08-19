import { createStandardApiReference } from "@univer-cli/api-reference";
import { createApiCommand } from "@univer-cli/api-reference-command";
import { Command } from "commander";

export function createProgram(): Command {
  const program = new Command("univer-api")
    .description("Search and inspect the Univer Facade API offline")
    .showHelpAfterError()
    .exitOverride();

  program.addCommand(
    createApiCommand({
      reference: createStandardApiReference(),
    }),
  );

  return program;
}
