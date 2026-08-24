import Database from "libsql";
import { parseUnitType, type UnitSummary } from "../shared/unit.js";

interface UnitRow {
  readonly name: string;
  readonly unit_id: string;
  readonly unit_type: string;
}

export class UnitStore {
  private readonly database: Database.Database;

  constructor(filename: string) {
    this.database = new Database(filename);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS example_units (
        unit_id TEXT PRIMARY KEY,
        unit_type TEXT NOT NULL,
        name TEXT NOT NULL
      )
    `);
  }

  add(unit: UnitSummary): void {
    this.database
      .prepare(
        `INSERT INTO example_units (unit_id, unit_type, name)
         VALUES (?, ?, ?)`,
      )
      .run(unit.unitId, unit.unitType, unit.name);
  }

  get(unitId: string): UnitSummary | undefined {
    const row = this.database
      .prepare("SELECT unit_id, unit_type, name FROM example_units WHERE unit_id = ?")
      .get(unitId) as UnitRow | undefined;
    return row === undefined ? undefined : toUnit(row);
  }

  list(): readonly UnitSummary[] {
    const rows = this.database
      .prepare("SELECT unit_id, unit_type, name FROM example_units")
      .all() as UnitRow[];
    return rows.map(toUnit);
  }

  close(): void {
    this.database.close();
  }
}

function toUnit(row: UnitRow): UnitSummary {
  return {
    name: row.name,
    unitId: row.unit_id,
    unitType: parseUnitType(row.unit_type),
  };
}
