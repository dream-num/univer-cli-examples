import { mkdir } from "node:fs/promises";
import { dirname, extname } from "node:path";
import {
  ExchangeError,
  ExchangeErrorCode,
  ExchangeFormat,
  FormulaCalculationMode,
  exportToFile,
  importFile,
  type ExportOptions,
  type ImportOptions,
} from "@univerjs-pro/exchange-node";
import type { LocalOfficeUnit, MiniUnitType, OfficeUnitData } from "./local-unit.js";
import { createLocalUnit, toUniverUnitType } from "./local-unit.js";
import { MiniCliError } from "./errors.js";

const SHEET_IMPORT_EXTENSIONS = new Set([".xls", ".xlsx", ".xlsm", ".csv", ".tsv"]);
const DOC_IMPORT_EXTENSIONS = new Set([".doc", ".docx"]);
const SLIDE_IMPORT_EXTENSIONS = new Set([".ppt", ".pptx", ".pptm", ".ppsx", ".ppsm", ".potx"]);
type ExportFormat =
  | ExchangeFormat.XLSX
  | ExchangeFormat.CSV
  | ExchangeFormat.TSV
  | ExchangeFormat.DOCX
  | ExchangeFormat.PPTX;

const importOfficeData = importFile as unknown as (
  path: string,
  options: ImportOptions,
) => Promise<OfficeUnitData>;
const exportOfficeData = exportToFile as unknown as (
  data: OfficeUnitData,
  path: string,
  options: ExportOptions,
) => Promise<void>;

export async function importOfficeFile(sourcePath: string): Promise<LocalOfficeUnit> {
  const unitType = inferImportUnitType(sourcePath);
  const data = await withExchangeError(() =>
    importOfficeData(sourcePath, importOptions(sourcePath, unitType)),
  );
  return createLocalUnit(unitType, normalizeRevision(data));
}

export async function exportOfficeFile(
  unit: LocalOfficeUnit,
  outputPath: string,
): Promise<{ readonly format: ExportFormat; readonly outputPath: string }> {
  await mkdir(dirname(outputPath), { recursive: true });
  let format: ExportFormat;
  if (unit.unitType === "sheet") {
    format = inferSheetExportFormat(outputPath);
  } else if (unit.unitType === "doc") {
    assertExportExtension(outputPath, ".docx", unit.unitType);
    format = ExchangeFormat.DOCX;
  } else {
    assertExportExtension(outputPath, ".pptx", unit.unitType);
    format = ExchangeFormat.PPTX;
  }
  await withExchangeError(() =>
    exportOfficeData(unit.data, outputPath, exportOptions(unit.unitType, format)),
  );
  return { format, outputPath };
}

function importOptions(sourcePath: string, unitType: MiniUnitType): ImportOptions {
  const extension = extname(sourcePath).toLowerCase();
  const format = importFormatOverride(extension);
  return {
    type: toUniverUnitType(unitType),
    ...(format === undefined ? {} : { format }),
    ...(unitType === "sheet" && (extension === ".xlsx" || extension === ".xlsm")
      ? { formulaCalculation: FormulaCalculationMode.FORCED }
      : {}),
  } as ImportOptions;
}

function exportOptions(unitType: MiniUnitType, format: ExportFormat): ExportOptions {
  return {
    type: toUniverUnitType(unitType),
    format,
    ...(unitType === "sheet"
      ? { formulaCalculation: FormulaCalculationMode.FORCED }
      : {}),
  } as ExportOptions;
}

function importFormatOverride(extension: string): ExchangeFormat | undefined {
  if (extension === ".xlsm") return ExchangeFormat.XLSX;
  if ([".pptm", ".ppsx", ".ppsm", ".potx"].includes(extension)) {
    return ExchangeFormat.PPTX;
  }
  return undefined;
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
): ExchangeFormat.XLSX | ExchangeFormat.CSV | ExchangeFormat.TSV {
  const extension = extname(path).toLowerCase();
  if (extension === ".xlsx") return ExchangeFormat.XLSX;
  if (extension === ".csv") return ExchangeFormat.CSV;
  if (extension === ".tsv") return ExchangeFormat.TSV;
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

async function withExchangeError<Result>(operation: () => Promise<Result>): Promise<Result> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ExchangeError && error.code === ExchangeErrorCode.NATIVE_LOAD_FAILED) {
      throw new MiniCliError(
        "dependency-unavailable",
        "The native Office exchange binding is unavailable.",
        { cause: error },
      );
    }
    throw new MiniCliError("conversion-failed", "Office file conversion failed.", {
      cause: error,
    });
  }
}
