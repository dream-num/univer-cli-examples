import type Database from "libsql";
import type { WorktreeSummary } from "../shared/worktree.js";

interface WorktreeRow {
  worktreeID: string;
  status: WorktreeSummary["status"];
  units: string;
}

export class WorktreeRepository {
  private readonly listWorktrees;

  constructor(directory: Database.Database) {
    this.listWorktrees = directory.prepare(`
      SELECT w.worktree_id AS worktreeID, w.status,
        json_group_array(json_object('unitID', u.unit_id) ORDER BY u.unit_order)
          FILTER (WHERE u.unit_id IS NOT NULL) AS units
      FROM collaboration_worktrees AS w
      LEFT JOIN collaboration_worktree_units AS u ON u.worktree_id = w.worktree_id
      GROUP BY w.worktree_id
      ORDER BY w.worktree_id
    `);
  }

  list(): WorktreeSummary[] {
    const rows = this.listWorktrees.all() as WorktreeRow[];
    return rows.map(({ worktreeID, status, units }) => ({
      worktreeID,
      status,
      units: JSON.parse(units) as WorktreeSummary["units"],
    }));
  }
}
