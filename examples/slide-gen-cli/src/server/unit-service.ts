import { randomUUID } from "node:crypto";
import type { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { getSlidesEmptySnapshot } from "@univerjs-pro/slides";
import { LocaleType } from "@univerjs/core";
import { UniverType } from "@univerjs/protocol";
import { UNIT_TYPE } from "../shared/unit.js";
import type { UnitRepository } from "./unit-repository.js";

export class UnitService {
  constructor(
    private readonly collabService: UniverCollabService,
    private readonly repository: UnitRepository,
    private readonly userID: string,
  ) {}

  async create(name = "Untitled Slide", unitId = randomUUID().slice(0, 8)) {
    const result = await this.collabService.createUnitFromData(
      {
        type: UniverType.UNIVER_SLIDE,
        data: { ...getSlidesEmptySnapshot(unitId, LocaleType.EN_US, name), rev: 1 },
        metadata: { name },
      },
      { userID: this.userID },
    );
    if (result.status === "already-exists") return { status: result.status } as const;

    return {
      status: result.status,
      unit: { name, unitId: result.unitID, unitType: UNIT_TYPE, revision: result.headRevision },
    } as const;
  }

  list() {
    return this.repository.list();
  }

  findById(unitId: string) {
    return this.repository.findById(unitId);
  }
}
