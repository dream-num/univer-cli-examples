import type { WorktreeData } from "@univerjs-pro/collaboration-worktree-service";
import type Database from "libsql";

interface WorktreeRow {
  readonly data_json: string;
}

/** Example-owned projection used to build the browser's Worktree navigation. */
export class WorktreeRepository {
  private readonly saveWorktree;
  private readonly listWorktrees;

  constructor(directory: Database.Database) {
    directory.exec(`
      CREATE TABLE IF NOT EXISTS example_worktrees (
        worktree_id TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    this.saveWorktree = directory.prepare(`
      INSERT INTO example_worktrees (worktree_id, data_json, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(worktree_id) DO UPDATE SET
        data_json = excluded.data_json, updated_at = excluded.updated_at
    `);
    this.listWorktrees = directory.prepare(
      "SELECT data_json FROM example_worktrees ORDER BY updated_at DESC",
    );
  }

  upsert(worktree: WorktreeData): void {
    this.saveWorktree.run(worktree.worktreeID, JSON.stringify(worktree), Date.now());
  }

  list(): WorktreeData[] {
    const rows = this.listWorktrees.all() as WorktreeRow[];
    return rows.map((row) => JSON.parse(row.data_json) as WorktreeData);
  }
}
