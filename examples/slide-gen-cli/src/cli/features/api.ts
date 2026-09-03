import { createStandardApiReference } from "@univer-cli/api-reference";
import { createApiCommand } from "@univer-cli/api-reference-command";
import type { Command } from "commander";

export function apiCommand(): Command {
  return createApiCommand({ reference: createStandardApiReference() }).description(
    "Find and show Facade APIs for Agents",
  );
}
