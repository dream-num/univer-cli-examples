import { prepareContentExecutionProgram } from "@univer-cli/content-execution";
import {
  createStandardHeadlessUniverFacade,
  createStandardHeadlessUniverFactory,
} from "@univer-cli/headless-univer";
import { randomUUID } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { UniverInstanceType, type IDocumentData } from "@univerjs/core";

export interface LoadedDocument {
  readonly data: IDocumentData;
  readonly path: string;
}

export interface ExecuteResult {
  readonly ok: true;
  readonly targetUnitId: string;
  readonly document: string;
  readonly value: unknown;
}

export interface OperationFailure {
  readonly ok: false;
  readonly code: "ARGUMENT_ERROR" | "EXECUTE_ERROR" | "IO_ERROR" | "RENDER_ERROR";
  readonly message: string;
}

export async function loadDocument(path: string): Promise<LoadedDocument> {
  const location = resolve(path);
  let text: string;
  try {
    text = await readFile(location, "utf8");
  } catch (error) {
    throw codedError("IO_ERROR", `Cannot read Doc JSON ${location}: ${message(error)}`);
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw codedError("ARGUMENT_ERROR", `Invalid Doc JSON ${location}: ${message(error)}`);
  }
  if (!isRecord(value) || typeof value.id !== "string" || value.id.trim().length === 0) {
    throw codedError("ARGUMENT_ERROR", `Doc JSON ${location} must contain a non-empty id`);
  }
  return { data: value as unknown as IDocumentData, path: location };
}

export async function executeDocument(
  documentPath: string,
  scriptPath: string,
): Promise<ExecuteResult | OperationFailure> {
  try {
    const loaded = await loadDocument(documentPath);
    let source: string;
    try {
      source = await readFile(resolve(scriptPath), "utf8");
    } catch (error) {
      throw codedError("IO_ERROR", `Cannot read script ${resolve(scriptPath)}: ${message(error)}`);
    }
    const program = prepareContentExecutionProgram({
      code: source,
      unitId: loaded.data.id,
      unitType: "doc",
    });
    const createUniver = createStandardHeadlessUniverFactory({
      license: process.env["UNIVER_LICENSE"] ?? "",
    });
    const univer = await createUniver({
      unitId: loaded.data.id,
      unitType: UniverInstanceType.UNIVER_DOC,
    });
    let saved: IDocumentData;
    let value: unknown;
    try {
      univer.createUnit(UniverInstanceType.UNIVER_DOC, loaded.data);
      const univerAPI = createStandardHeadlessUniverFacade(univer);
      // Trusted task-local Facade code is the explicit input of this command.
      // oxlint-disable-next-line no-new-func -- content-execution prepares an async function body.
      const execute = new Function(
        "univerAPI",
        `"use strict"; return (async () => { ${program}\n})();`,
      ) as (api: typeof univerAPI) => Promise<unknown>;
      value = jsonValue(await execute(univerAPI));
      const document = univerAPI.getDocument(loaded.data.id);
      if (document === null) throw new Error(`Cannot find Doc ${loaded.data.id}`);
      saved = document.save();
      if (saved.id !== loaded.data.id) throw new Error("Saved Doc changed its Local Doc Identity");
    } catch (error) {
      throw codedError("EXECUTE_ERROR", message(error));
    } finally {
      univer.dispose();
    }
    await writeJsonAtomically(loaded.path, saved);
    return { ok: true, targetUnitId: saved.id, document: loaded.path, value };
  } catch (error) {
    return failure(error, "EXECUTE_ERROR");
  }
}

export function failure(error: unknown, fallback: OperationFailure["code"]): OperationFailure {
  const code = Reflect.get(Object(error), "code");
  return {
    ok: false,
    code: isFailureCode(code) ? code : fallback,
    message: message(error),
  };
}

function jsonValue(value: unknown): unknown {
  if (value === undefined) return null;
  let encoded: string | undefined;
  try {
    encoded = JSON.stringify(value);
  } catch (error) {
    throw new Error(`Script return value is not JSON-compatible: ${message(error)}`);
  }
  if (encoded === undefined) throw new Error("Script return value is not JSON-compatible");
  return JSON.parse(encoded) as unknown;
}

async function writeJsonAtomically(path: string, value: IDocumentData): Promise<void> {
  const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporary, path);
  } catch (error) {
    throw codedError("IO_ERROR", `Cannot save Doc JSON ${path}: ${message(error)}`);
  } finally {
    await rm(temporary, { force: true });
  }
}

function codedError(code: OperationFailure["code"], text: string): Error {
  return Object.assign(new Error(text), { code });
}

function isFailureCode(value: unknown): value is OperationFailure["code"] {
  return ["ARGUMENT_ERROR", "EXECUTE_ERROR", "IO_ERROR", "RENDER_ERROR"].includes(String(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
