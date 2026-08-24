import { Command } from "commander";
import { apiCommand } from "./features/api.js";
import { executeCommand, inspectCommand } from "./features/unit-content.js";
import { createUnitCommand, openUnitCommand } from "./features/unit.js";
import { screenshotCommand } from "./features/visual.js";

export function createProgram(): Command {
  const program = new Command("visual-inspection").description(
    "Create, edit, view, and capture collaborative Univer content",
  );
  program.addCommand(createUnitCommand());
  program.addCommand(inspectCommand());
  program.addCommand(executeCommand());
  program.addCommand(openUnitCommand());
  program.addCommand(apiCommand());
  program.addCommand(screenshotCommand());
  return program;
}
