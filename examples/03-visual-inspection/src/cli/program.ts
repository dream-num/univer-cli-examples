import { Command } from "commander";
import { apiCommand } from "./features/api.js";
import { exportFileCommand, importFileCommand } from "./features/file.js";
import { executeCommand, inspectCommand } from "./features/unit-content.js";
import { createUnitCommand, openUnitCommand } from "./features/unit.js";
import { lintCommand, screenshotCommand } from "./features/visual.js";

export function createProgram(): Command {
  const program = new Command("univer-example-cli").description(
    "Create, edit, view, and capture collaborative Univer content",
  );
  program.addCommand(createUnitCommand());
  program.addCommand(importFileCommand());
  program.addCommand(exportFileCommand());
  program.addCommand(inspectCommand());
  program.addCommand(executeCommand());
  program.addCommand(openUnitCommand());
  program.addCommand(apiCommand());
  program.addCommand(screenshotCommand());
  program.addCommand(lintCommand());
  return program;
}
