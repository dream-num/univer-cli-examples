import { createStandardApiReference } from "@univer-cli/api-reference";
import { createApiCommand } from "@univer-cli/api-reference-command";
import { Command } from "commander";

export function createProgram(): Command {
  const program = new Command("univer-quick-start")
    .description("Minimal Univer CLI SDK composition example")
    .showHelpAfterError()
    .exitOverride();

  program.addCommand(
    createApiCommand({
      reference: createStandardApiReference(),
    }),
  );

  return program;
}
