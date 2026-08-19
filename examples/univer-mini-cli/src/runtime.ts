import {
  createStandardHeadlessUniverFacade,
  createStandardHeadlessUniverFactory,
} from "@univer-cli/headless-univer";
import type { FUniver } from "@univerjs/core/facade";
import { MiniCliError } from "./errors.js";
import { toUniverUnitType, type LocalOfficeUnit, type OfficeUnitData } from "./local-unit.js";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface LocalRuntime {
  readonly unitId: string;
  readonly unitType: LocalOfficeUnit["unitType"];
  execute(input: { readonly code: string; readonly mode: "read" | "write" }): Promise<{
    readonly value: JsonValue;
  }>;
  exportUnitData(): OfficeUnitData;
  close(): void;
}

export async function loadLocalRuntime(
  unit: LocalOfficeUnit,
  license: string,
): Promise<LocalRuntime> {
  const numericUnitType = toUniverUnitType(unit.unitType);
  const univer = await createStandardHeadlessUniverFactory({ license })({
    unitId: unit.data.id,
    unitType: numericUnitType,
  });
  try {
    if (unit.unitType === "sheet") {
      univer.createUnit(toUniverUnitType("sheet"), structuredClone(unit.data));
    } else if (unit.unitType === "doc") {
      univer.createUnit(toUniverUnitType("doc"), structuredClone(unit.data));
    } else {
      univer.createUnit(toUniverUnitType("slide"), structuredClone(unit.data));
    }
    const univerAPI = createStandardHeadlessUniverFacade(univer);
    return {
      unitId: unit.data.id,
      unitType: unit.unitType,
      execute: async (input) => ({ value: await executeFacadeCode(univerAPI, input.code) }),
      exportUnitData: () => exportUnitData(univerAPI, unit),
      close: () => univer.dispose(),
    };
  } catch (error) {
    univer.dispose();
    throw error;
  }
}

async function executeFacadeCode(univerAPI: FUniver, code: string): Promise<JsonValue> {
  // This example intentionally executes trusted agent-authored code; it is not a sandbox.
  // oxlint-disable-next-line no-new-func -- Facade code is the explicit input to this CLI command.
  const execute = new Function("univerAPI", `return (async () => { ${code}\n})();`) as (
    api: FUniver,
  ) => Promise<unknown>;
  return toJsonValue(await execute(univerAPI));
}

function exportUnitData(univerAPI: FUniver, unit: LocalOfficeUnit): OfficeUnitData {
  const revision = unit.data.rev ?? 1;
  if (unit.unitType === "sheet") {
    const saved = univerAPI.getWorkbook(unit.data.id)?.save();
    if (saved === undefined) failUnitUnavailable(unit.data.id);
    return structuredClone({ ...saved, rev: revision });
  }
  if (unit.unitType === "doc") {
    const saved = univerAPI.getDocument(unit.data.id)?.save();
    if (saved === undefined) failUnitUnavailable(unit.data.id);
    return structuredClone({ ...saved, rev: revision });
  }
  const saved = univerAPI.getPresentation(unit.data.id)?.save();
  if (saved === undefined) failUnitUnavailable(unit.data.id);
  return structuredClone({ ...saved, rev: revision });
}

function failUnitUnavailable(unitId: string): never {
  throw new MiniCliError("LOCAL_UNIT_UNAVAILABLE", `Unit ${unitId} is unavailable`);
}

function toJsonValue(value: unknown): JsonValue {
  if (value === undefined) return null;
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch (error) {
    throw new MiniCliError(
      "EXECUTION_RESULT_NOT_JSON",
      "Facade execution result must be JSON-serializable",
      { cause: error },
    );
  }
  if (serialized === undefined) {
    throw new MiniCliError("EXECUTION_RESULT_NOT_JSON", "Facade execution result is not JSON");
  }
  return JSON.parse(serialized) as JsonValue;
}
