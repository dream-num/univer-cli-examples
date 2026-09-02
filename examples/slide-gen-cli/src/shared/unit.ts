import { UniverInstanceType } from "@univerjs/core";

export const UNIT_TYPE = "slide" as const;
export type UnitType = typeof UNIT_TYPE;

export interface UnitSummary {
  readonly name: string;
  readonly unitId: string;
  readonly unitType: UnitType;
}

export function unitTypeLabel(): string {
  return "Slide";
}

export function parseUnitType(value: unknown): UnitType {
  if (value === UNIT_TYPE) return value;
  throw new Error("Unit type must be slide");
}

export function toInstanceType(): UniverInstanceType {
  return UniverInstanceType.UNIVER_SLIDE;
}

export function fromInstanceType(unitType: UniverInstanceType): UnitType {
  if (unitType === UniverInstanceType.UNIVER_SLIDE) return UNIT_TYPE;
  throw new Error("Slide Gen CLI supports Slide units");
}
