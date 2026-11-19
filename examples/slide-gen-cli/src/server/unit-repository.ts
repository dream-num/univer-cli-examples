import type Database from "libsql";
import { UniverType } from "@univerjs/protocol";
import type { UnitSummary } from "../shared/unit.js";

export class UnitRepository {
  private readonly listUnits;
  private readonly findUnit;

  constructor(directory: Database.Database) {
    const unitQuery = `
      SELECT unit_id AS unitId,
        CASE WHEN json_type(metadata, '$.name') = 'text' THEN metadata ->> '$.name' ELSE unit_id END AS name,
        'slide' AS unitType
      FROM collaboration_units WHERE deleted_status IS NULL AND type = ${UniverType.UNIVER_SLIDE}
    `;
    this.listUnits = directory.prepare(`${unitQuery} ORDER BY rowid DESC`);
    this.findUnit = directory.prepare(`${unitQuery} AND unit_id = ?`);
  }

  list(): UnitSummary[] {
    return this.listUnits.all() as UnitSummary[];
  }

  findById(unitId: string): UnitSummary | undefined {
    const [unit] = this.findUnit.all(unitId) as UnitSummary[];
    return unit;
  }
}
