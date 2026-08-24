import { Command } from "commander";
import { apiCommand } from "./features/api.js";
import { executeCommand, inspectCommand } from "./features/unit-content.js";
import { createUnitCommand, openUnitCommand } from "./features/unit.js";

export function createProgram(): Command {
  const program = new Command("univer-example-cli").description(
    "Create, inspect, edit, and view collaborative Univer content",
  );
  program.addCommand(createUnitCommand());
  program.addCommand(inspectCommand());
  program.addCommand(executeCommand());
  program.addCommand(openUnitCommand());
  program.addCommand(apiCommand());
  return program;
}
