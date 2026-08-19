import { randomUUID } from "node:crypto";
import {
  createStandardHeadlessUniverFacade,
  createStandardHeadlessUniverFactory,
} from "@univer-cli/headless-univer";
import {
  createLocalUnit,
  toUniverUnitType,
  type LocalOfficeUnit,
  type OfficeUnitData,
} from "./local-unit.js";

export async function createEmptyUnit(
  unitType: LocalOfficeUnit["unitType"],
  name: string,
  license: string,
): Promise<LocalOfficeUnit> {
  const unitId = randomUUID();
  const univer = await createStandardHeadlessUniverFactory({ license })({
    unitId,
    unitType: toUniverUnitType(unitType),
  });
  try {
    const univerAPI = createStandardHeadlessUniverFacade(univer);
    let data: OfficeUnitData;
    if (unitType === "sheet") {
      data = univerAPI.createWorkbook({ id: unitId, name }).save();
    } else if (unitType === "doc") {
      data = univerAPI.createDocument({ id: unitId, title: name }).save();
    } else {
      data = univerAPI.createPresentation({ id: unitId, name }).save();
    }
    const versioned = { ...data, rev: 1 };
    if (unitType === "sheet") return createLocalUnit("sheet", versioned);
    if (unitType === "doc") return createLocalUnit("doc", versioned);
    return createLocalUnit("slide", versioned);
  } finally {
    univer.dispose();
  }
}
