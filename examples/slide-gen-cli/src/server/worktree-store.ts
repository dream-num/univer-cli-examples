import type { WorktreeData } from "@univerjs-pro/collaboration-worktree-service";
import Database from "libsql";

interface WorktreeRow {
  readonly data_json: string;
}

/** Example-owned projection used to build the browser's Worktree navigation. */
export class WorktreeStore {
  private readonly database: Database.Database;

  constructor(filename: string) {
    this.database = new Database(filename);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS example_worktrees (
        worktree_id TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  }

  upsert(worktree: WorktreeData): void {
    this.database
      .prepare(
        `INSERT INTO example_worktrees (worktree_id, data_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(worktree_id) DO UPDATE SET
           data_json = excluded.data_json,
           updated_at = excluded.updated_at`,
      )
      .run(worktree.worktreeID, JSON.stringify(worktree), Date.now());
  }

  list(): readonly WorktreeData[] {
    const rows = this.database
      .prepare("SELECT data_json FROM example_worktrees ORDER BY updated_at DESC")
      .all() as WorktreeRow[];
    return rows.map((row) => JSON.parse(row.data_json) as WorktreeData);
  }

  close(): void {
    this.database.close();
  }
}
