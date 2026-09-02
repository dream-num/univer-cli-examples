import { extname } from "node:path";
import { ExchangeFormat, exportToFile } from "@univerjs-pro/exchange-node";
import { UniverInstanceType } from "@univerjs/core";
import type { ISlideData } from "@univerjs-pro/slides";
import { Command, Option } from "commander";
import { DEFAULT_SERVER_URL } from "../../shared/urls.js";
import { loadRuntime } from "./unit-content.js";

interface ExportOptions {
  readonly trunk?: boolean;
  readonly unit: string;
  readonly worktree?: string;
}

export function exportFileCommand(): Command {
  return new Command("export")
    .description("Export a collaborative Slide as PPTX")
    .argument("<file>", "output .pptx file")
    .requiredOption("--unit <id>", "Unit id")
    .addOption(new Option("--trunk", "export from trunk").conflicts("worktree"))
    .addOption(new Option("--worktree <id>", "export from a Worktree").conflicts("trunk"))
    .action(async (file: string, options: ExportOptions) => {
      if (options.trunk !== true && options.worktree === undefined) {
        throw new Error("Specify --trunk or --worktree <id>");
      }
      requireExtension(file, ".pptx");
      const runtime = await loadRuntime(DEFAULT_SERVER_URL, options.unit, options.worktree);
      try {
        await exportToFile((await runtime.exportUnitData()) as ISlideData, file, {
          type: UniverInstanceType.UNIVER_SLIDE,
          format: ExchangeFormat.PPTX,
        });
      } finally {
        await runtime.close();
      }
      process.stdout.write(`${file}\n`);
    });
}

function requireExtension(file: string, extension: string): void {
  if (extname(file).toLowerCase() !== extension) {
    throw new Error(`Slide export file must end in ${extension}`);
  }
}
