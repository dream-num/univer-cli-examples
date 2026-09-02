import {
  createNodeResourceLibraryFactory,
  type ResourceLibrary,
} from "@univer-cli/resource-library";
import { createResourcesCommand } from "@univer-cli/resource-library-command";
import { builtinTextMeasurer } from "@univer-cli/svg-facade";
import { createCompileSvgCommand } from "@univer-cli/svg-facade-command";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { Command } from "commander";
import { apiCommand } from "./features/api.js";
import { exportFileCommand, importFileCommand } from "./features/file.js";
import { executeCommand, inspectCommand } from "./features/unit-content.js";
import { createUnitCommand, openUnitCommand } from "./features/unit.js";
import { lintCommand, screenshotCommand } from "./features/visual.js";
import { worktreeCommand } from "./features/worktree.js";

export interface ProgramOptions {
  readonly openResourceLibrary?: () => ResourceLibrary;
}

export function createProgram(options: ProgramOptions = {}): Command {
  const program = new Command("univer-example-cli").description(
    "Author resource-backed Univer Slides through an isolated Worktree",
  );
  program.addCommand(createUnitCommand());
  program.addCommand(importFileCommand());
  program.addCommand(exportFileCommand());
  program.addCommand(worktreeCommand());
  program.addCommand(inspectCommand());
  program.addCommand(executeCommand());
  program.addCommand(openUnitCommand());
  program.addCommand(apiCommand());
  program.addCommand(screenshotCommand());
  program.addCommand(lintCommand());
  program.addCommand(
    createResourcesCommand({
      openLibrary:
        options.openResourceLibrary ??
        createNodeResourceLibraryFactory({
          cacheRoot: resolve(".data/resources"),
          manifestPath: createRequire(import.meta.url).resolve(
            "@univerjs-pro/cli-assets/manifest.json",
          ),
        }),
    }),
  );
  program.addCommand(createCompileSvgCommand({ textMeasurer: builtinTextMeasurer }));
  return program;
}
