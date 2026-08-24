import { Command } from "commander";
import { apiCommand } from "./features/api.js";
import { executeCommand, inspectCommand } from "./features/unit-content.js";
import { createUnitCommand, openUnitCommand } from "./features/unit.js";
import { lintCommand, screenshotCommand } from "./features/visual.js";
import { worktreeCommand } from "./features/worktree.js";

export function createProgram(): Command {
  const program = new Command("univer-example-cli").description(
    "Edit collaborative Univer content through an isolated Worktree",
  );
  program.addCommand(createUnitCommand());
  program.addCommand(worktreeCommand());
  program.addCommand(inspectCommand());
  program.addCommand(executeCommand());
  program.addCommand(openUnitCommand());
  program.addCommand(apiCommand());
  program.addCommand(screenshotCommand());
  program.addCommand(lintCommand());
  return program;
}
