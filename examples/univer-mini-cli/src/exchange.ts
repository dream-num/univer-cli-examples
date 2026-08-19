import { mkdir } from "node:fs/promises";
import { dirname, extname } from "node:path";
import { UnitExchangeFormat, createUnitExchange } from "@univer-cli/unit-exchange";
import type { LocalOfficeUnit, MiniUnitType, OfficeUnitData } from "./local-unit.js";
import { createLocalUnit, toUniverUnitType } from "./local-unit.js";
import { MiniCliError } from "./errors.js";

const SHEET_IMPORT_EXTENSIONS = new Set([".xls", ".xlsx", ".xlsm", ".csv", ".tsv"]);
const DOC_IMPORT_EXTENSIONS = new Set([".doc", ".docx"]);
const SLIDE_IMPORT_EXTENSIONS = new Set([".ppt", ".pptx", ".pptm", ".ppsx", ".ppsm", ".potx"]);

export async function importOfficeFile(sourcePath: string): Promise<LocalOfficeUnit> {
  const unitType = inferImportUnitType(sourcePath);
  const exchange = createUnitExchange();
  if (unitType === "sheet") {
    const imported = await exchange.importFile({
      sourcePath,
      unitType: toUniverUnitType("sheet"),
    });
    return createLocalUnit("sheet", normalizeRevision(imported.data));
  }
  if (unitType === "doc") {
    const imported = await exchange.importFile({
      sourcePath,
      unitType: toUniverUnitType("doc"),
    });
    return createLocalUnit("doc", normalizeRevision(imported.data));
  }
  const imported = await exchange.importFile({
    sourcePath,
    unitType: toUniverUnitType("slide"),
  });
  return createLocalUnit("slide", normalizeRevision(imported.data));
}

export async function exportOfficeFile(
  unit: LocalOfficeUnit,
  outputPath: string,
): Promise<{ readonly format: UnitExchangeFormat; readonly outputPath: string }> {
  await mkdir(dirname(outputPath), { recursive: true });
  const exchange = createUnitExchange();
  if (unit.unitType === "sheet") {
    const format = inferSheetExportFormat(outputPath);
    await exchange.exportFile({
      format,
      outputPath,
      unit: { data: unit.data, type: toUniverUnitType("sheet") },
    });
    return { format, outputPath };
  } else if (unit.unitType === "doc") {
    assertExportExtension(outputPath, ".docx", unit.unitType);
    await exchange.exportFile({
      format: UnitExchangeFormat.DOCX,
      outputPath,
      unit: { data: unit.data, type: toUniverUnitType("doc") },
    });
    return { format: UnitExchangeFormat.DOCX, outputPath };
  } else {
    assertExportExtension(outputPath, ".pptx", unit.unitType);
    await exchange.exportFile({
      format: UnitExchangeFormat.PPTX,
      outputPath,
      unit: { data: unit.data, type: toUniverUnitType("slide") },
    });
    return { format: UnitExchangeFormat.PPTX, outputPath };
  }
}

function inferImportUnitType(path: string): MiniUnitType {
  const extension = extname(path).toLowerCase();
  if (SHEET_IMPORT_EXTENSIONS.has(extension)) return "sheet";
  if (DOC_IMPORT_EXTENSIONS.has(extension)) return "doc";
  if (SLIDE_IMPORT_EXTENSIONS.has(extension)) return "slide";
  throw new MiniCliError(
    "OFFICE_IMPORT_FORMAT_UNSUPPORTED",
    `Cannot infer an Office Unit type from extension ${extension || "(none)"}`,
  );
}

function inferSheetExportFormat(
  path: string,
): UnitExchangeFormat.XLSX | UnitExchangeFormat.CSV | UnitExchangeFormat.TSV {
  const extension = extname(path).toLowerCase();
  if (extension === ".xlsx") return UnitExchangeFormat.XLSX;
  if (extension === ".csv") return UnitExchangeFormat.CSV;
  if (extension === ".tsv") return UnitExchangeFormat.TSV;
  throw new MiniCliError(
    "OFFICE_EXPORT_FORMAT_UNSUPPORTED",
    `Extension ${extension || "(none)"} is not supported for a sheet Unit`,
  );
}

function assertExportExtension(path: string, expected: string, unitType: MiniUnitType): void {
  const extension = extname(path).toLowerCase();
  if (extension === expected) return;
  throw new MiniCliError(
    "OFFICE_EXPORT_FORMAT_UNSUPPORTED",
    `Extension ${extension || "(none)"} is not supported for a ${unitType} Unit`,
  );
}

function normalizeRevision<T extends OfficeUnitData>(data: T): T {
  const revision = data.rev;
  return Number.isSafeInteger(revision) && revision !== undefined && revision >= 1
    ? data
    : { ...data, rev: 1 };
}
