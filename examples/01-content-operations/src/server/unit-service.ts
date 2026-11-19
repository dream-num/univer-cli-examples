import { randomUUID } from "node:crypto";
import type { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { unitTypeLabel, type UnitType } from "../shared/unit.js";
import { createUnitInput } from "./unit-data.js";
import type { UnitRepository } from "./unit-repository.js";

export class UnitService {
  constructor(
    private readonly collabService: UniverCollabService,
    private readonly repository: UnitRepository,
    private readonly userID: string,
  ) {}

  async create(unitType: UnitType, name = `Untitled ${unitTypeLabel(unitType)}`) {
    const unitId = randomUUID().slice(0, 8);
    const result = await this.collabService.createUnitFromData(
      { ...createUnitInput(unitType, unitId, name), metadata: { name } },
      { userID: this.userID },
    );
    if (result.status === "already-exists") return { status: result.status } as const;

    return {
      status: result.status,
      unit: { name, unitId, unitType, revision: result.headRevision },
    } as const;
  }

  list() {
    return this.repository.list();
  }

  findById(unitId: string) {
    return this.repository.findById(unitId);
  }
}
