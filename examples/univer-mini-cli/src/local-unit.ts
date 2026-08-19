import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ISlideData } from "@univerjs-pro/slides";
import { UniverInstanceType, type IDocumentData, type IWorkbookData } from "@univerjs/core";
import { MiniCliError } from "./errors.js";

export const LOCAL_UNIT_FORMAT = "univer-mini/local-office-unit";
export const LOCAL_UNIT_VERSION = 1;

export const MINI_UNIT_TYPES = ["sheet", "doc", "slide"] as const;
export type MiniUnitType = (typeof MINI_UNIT_TYPES)[number];

interface LocalUnitBase {
  readonly format: typeof LOCAL_UNIT_FORMAT;
  readonly version: typeof LOCAL_UNIT_VERSION;
}

export type LocalOfficeUnit =
  | (LocalUnitBase & { readonly unitType: "sheet"; readonly data: IWorkbookData })
  | (LocalUnitBase & { readonly unitType: "doc"; readonly data: IDocumentData })
  | (LocalUnitBase & { readonly unitType: "slide"; readonly data: ISlideData });

export type OfficeUnitData = IWorkbookData | IDocumentData | ISlideData;

export async function readLocalUnit(path: string): Promise<LocalOfficeUnit> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch (error) {
    throw new MiniCliError("LOCAL_UNIT_READ_FAILED", `Cannot read local Unit file ${path}`, {
      cause: error,
    });
  }
  return validateLocalUnit(parsed, path);
}

export async function writeNewLocalUnit(path: string, unit: LocalOfficeUnit): Promise<void> {
  await writeLocalUnitFile(path, unit, false);
}

export async function replaceLocalUnit(path: string, unit: LocalOfficeUnit): Promise<void> {
  await writeLocalUnitFile(path, unit, true);
}

export function createLocalUnit(unitType: "sheet", data: IWorkbookData): LocalOfficeUnit;
export function createLocalUnit(unitType: "doc", data: IDocumentData): LocalOfficeUnit;
export function createLocalUnit(unitType: "slide", data: ISlideData): LocalOfficeUnit;
export function createLocalUnit(unitType: MiniUnitType, data: OfficeUnitData): LocalOfficeUnit;
export function createLocalUnit(unitType: MiniUnitType, data: OfficeUnitData): LocalOfficeUnit {
  const base = { format: LOCAL_UNIT_FORMAT, version: LOCAL_UNIT_VERSION } as const;
  if (unitType === "sheet") return { ...base, unitType, data: data as IWorkbookData };
  if (unitType === "doc") return { ...base, unitType, data: data as IDocumentData };
  return { ...base, unitType, data: data as ISlideData };
}

export function toUniverUnitType(unitType: "sheet"): UniverInstanceType.UNIVER_SHEET;
export function toUniverUnitType(unitType: "doc"): UniverInstanceType.UNIVER_DOC;
export function toUniverUnitType(unitType: "slide"): UniverInstanceType.UNIVER_SLIDE;
export function toUniverUnitType(
  unitType: MiniUnitType,
):
  | UniverInstanceType.UNIVER_SHEET
  | UniverInstanceType.UNIVER_DOC
  | UniverInstanceType.UNIVER_SLIDE;
export function toUniverUnitType(unitType: MiniUnitType): UniverInstanceType {
  if (unitType === "sheet") return UniverInstanceType.UNIVER_SHEET;
  if (unitType === "doc") return UniverInstanceType.UNIVER_DOC;
  return UniverInstanceType.UNIVER_SLIDE;
}

export function isMiniUnitType(value: string): value is MiniUnitType {
  return MINI_UNIT_TYPES.some((unitType) => unitType === value);
}

function validateLocalUnit(value: unknown, path: string): LocalOfficeUnit {
  if (!isRecord(value)) failInvalid(path, "expected a JSON object");
  if (value.format !== LOCAL_UNIT_FORMAT) failInvalid(path, `format must be ${LOCAL_UNIT_FORMAT}`);
  if (value.version !== LOCAL_UNIT_VERSION) {
    failInvalid(path, `version must be ${LOCAL_UNIT_VERSION}`);
  }
  if (typeof value.unitType !== "string" || !isMiniUnitType(value.unitType)) {
    failInvalid(path, "unitType must be sheet, doc, or slide");
  }
  if (!isRecord(value.data) || typeof value.data.id !== "string" || value.data.id.length === 0) {
    failInvalid(path, "data.id must be a non-empty string");
  }
  if (!Number.isSafeInteger(value.data.rev) || Number(value.data.rev) < 1) {
    failInvalid(path, "data.rev must be a positive integer");
  }
  return value as unknown as LocalOfficeUnit;
}

async function writeLocalUnitFile(
  path: string,
  unit: LocalOfficeUnit,
  overwrite: boolean,
): Promise<void> {
  const directory = dirname(path);
  await mkdir(directory, { recursive: true });
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(unit, undefined, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    if (overwrite) {
      await rename(temporaryPath, path);
    } else {
      try {
        await link(temporaryPath, path);
      } catch (error) {
        if (isNodeError(error, "EEXIST")) {
          throw new MiniCliError(
            "LOCAL_UNIT_ALREADY_EXISTS",
            `Refusing to overwrite existing local Unit file ${path}`,
          );
        }
        throw error;
      }
      await unlink(temporaryPath);
    }
  } finally {
    await unlink(temporaryPath).catch(() => undefined);
  }
}

function failInvalid(path: string, reason: string): never {
  throw new MiniCliError("LOCAL_UNIT_INVALID", `Invalid local Unit file ${path}: ${reason}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === code;
}
