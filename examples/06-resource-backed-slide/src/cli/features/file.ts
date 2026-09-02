import { randomUUID } from "node:crypto";
import { basename, extname } from "node:path";
import { ExchangeFormat, exportToFile, importFile } from "@univerjs-pro/exchange-node";
import { UniverInstanceType, type IDocumentData, type IWorkbookData } from "@univerjs/core";
import type { ISlideData } from "@univerjs-pro/slides";
import { Command, Option } from "commander";
import { type UnitType } from "../../shared/unit.js";
import { createUnitUrl, DEFAULT_SERVER_URL } from "../../shared/urls.js";
import { loadRuntime } from "./unit-content.js";

interface ImportOptions {
  readonly name?: string;
}

interface ExportOptions {
  readonly trunk?: boolean;
  readonly unit: string;
  readonly worktree?: string;
}

export function importFileCommand(): Command {
  return new Command("import")
    .description("Import an Office file as a collaborative Unit")
    .argument("<file>", "input .xlsx, .docx, or .pptx file")
    .option("--name <name>", "Unit name")
    .action(async (file: string, options: ImportOptions) => {
      const unitId = randomUUID().slice(0, 8);
      const unitType = importUnitType(file);
      const data = await importOfficeFile(file, unitId, unitType);
      const response = await fetch(createUnitUrl(DEFAULT_SERVER_URL), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data,
          name: options.name ?? basename(file, extname(file)),
          type: unitType,
          unitId,
        }),
      });
      const created = (await response.json()) as { readonly unitId: string };
      process.stdout.write(`${created.unitId}\n`);
    });
}

export function exportFileCommand(): Command {
  return new Command("export")
    .description("Export a collaborative Unit as an Office file")
    .argument("<file>", "output .xlsx, .docx, or .pptx file")
    .requiredOption("--unit <id>", "Unit id")
    .addOption(new Option("--trunk", "export from trunk").conflicts("worktree"))
    .addOption(new Option("--worktree <id>", "export from a Worktree").conflicts("trunk"))
    .action(async (file: string, options: ExportOptions) => {
      if (options.trunk !== true && options.worktree === undefined) {
        throw new Error("Specify --trunk or --worktree <id>");
      }
      const runtime = await loadRuntime(DEFAULT_SERVER_URL, options.unit, options.worktree);
      try {
        const data = await runtime.exportUnitData();
        switch (runtime.unitType) {
          case UniverInstanceType.UNIVER_SHEET:
            requireExtension(file, ".xlsx", "Sheet");
            await exportToFile(data as IWorkbookData, file, {
              type: UniverInstanceType.UNIVER_SHEET,
              format: ExchangeFormat.XLSX,
            });
            break;
          case UniverInstanceType.UNIVER_DOC:
            requireExtension(file, ".docx", "Doc");
            await exportToFile(data as IDocumentData, file, {
              type: UniverInstanceType.UNIVER_DOC,
              format: ExchangeFormat.DOCX,
            });
            break;
          case UniverInstanceType.UNIVER_SLIDE:
            requireExtension(file, ".pptx", "Slide");
            await exportToFile(data as ISlideData, file, {
              type: UniverInstanceType.UNIVER_SLIDE,
              format: ExchangeFormat.PPTX,
            });
            break;
        }
      } finally {
        await runtime.close();
      }
      process.stdout.write(`${file}\n`);
    });
}

async function importOfficeFile(
  file: string,
  unitId: string,
  unitType: UnitType,
): Promise<unknown> {
  switch (unitType) {
    case "sheet":
      return await importFile(file, { type: UniverInstanceType.UNIVER_SHEET, unitId });
    case "doc":
      return await importFile(file, { type: UniverInstanceType.UNIVER_DOC, unitId });
    case "slide":
      return await importFile(file, { type: UniverInstanceType.UNIVER_SLIDE, unitId });
  }
}

function importUnitType(file: string): UnitType {
  switch (extname(file).toLowerCase()) {
    case ".xlsx":
      return "sheet";
    case ".docx":
      return "doc";
    case ".pptx":
      return "slide";
    default:
      throw new Error("Import file must end in .xlsx, .docx, or .pptx");
  }
}

function requireExtension(file: string, extension: string, unit: string): void {
  if (extname(file).toLowerCase() !== extension) {
    throw new Error(`${unit} export file must end in ${extension}`);
  }
}
