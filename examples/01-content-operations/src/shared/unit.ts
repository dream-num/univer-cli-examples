import { UniverInstanceType } from "@univerjs/core";

export const UNIT_TYPES = ["sheet", "doc", "slide"] as const;

export type UnitType = (typeof UNIT_TYPES)[number];

export interface UnitSummary {
  readonly name: string;
  readonly unitId: string;
  readonly unitType: UnitType;
}

export function unitTypeLabel(unitType: UnitType): string {
  switch (unitType) {
    case "sheet":
      return "Sheet";
    case "doc":
      return "Doc";
    case "slide":
      return "Slide";
  }
}

export function parseUnitType(value: unknown): UnitType {
  if (value === "sheet" || value === "doc" || value === "slide") return value;
  throw new Error("Unit type must be sheet, doc, or slide");
}

export function toInstanceType(unitType: UnitType): UniverInstanceType {
  switch (unitType) {
    case "sheet":
      return UniverInstanceType.UNIVER_SHEET;
    case "doc":
      return UniverInstanceType.UNIVER_DOC;
    case "slide":
      return UniverInstanceType.UNIVER_SLIDE;
  }
}

export function fromInstanceType(unitType: UniverInstanceType): UnitType {
  switch (unitType) {
    case UniverInstanceType.UNIVER_SHEET:
      return "sheet";
    case UniverInstanceType.UNIVER_DOC:
      return "doc";
    case UniverInstanceType.UNIVER_SLIDE:
      return "slide";
    default:
      throw new Error("This example supports Sheet, Doc, and Slide units");
  }
}
