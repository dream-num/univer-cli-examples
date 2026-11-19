import type { CreateUnitFromDataInput } from "@univerjs-pro/collaboration-service";
import { getSlidesEmptySnapshot } from "@univerjs-pro/slides";
import { getDocsEmptySnapshot, LocaleType, type IWorkbookData } from "@univerjs/core";
import { UniverType } from "@univerjs/protocol";
import type { UnitType } from "../shared/unit.js";

export function createUnitInput(
  unitType: UnitType,
  unitId: string,
  name: string,
): CreateUnitFromDataInput {
  switch (unitType) {
    case "sheet":
      return { type: UniverType.UNIVER_SHEET, data: createWorkbook(unitId, name) };
    case "doc":
      return {
        type: UniverType.UNIVER_DOC,
        data: { ...getDocsEmptySnapshot(unitId, LocaleType.EN_US, name), rev: 1 },
      };
    case "slide":
      return {
        type: UniverType.UNIVER_SLIDE,
        data: { ...getSlidesEmptySnapshot(unitId, LocaleType.EN_US, name), rev: 1 },
      };
  }
}

function createWorkbook(unitId: string, name: string): IWorkbookData {
  return {
    id: unitId,
    rev: 1,
    name,
    appVersion: "",
    locale: LocaleType.EN_US,
    sheetOrder: ["sheet-1"],
    sheets: {
      "sheet-1": {
        id: "sheet-1",
        name: "Data",
        rowCount: 100,
        columnCount: 20,
        cellData: {
          0: { 0: { v: "Name" }, 1: { v: "Value" } },
          1: { 0: { v: "Initial" }, 1: { v: 1 } },
        },
      },
    },
    styles: {},
    resources: [],
  };
}
