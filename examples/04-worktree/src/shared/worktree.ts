import type { WorktreeStatus } from "@univerjs-pro/collaboration-worktree-service";

export interface WorktreeSummary {
  readonly worktreeID: string;
  readonly status: WorktreeStatus;
  readonly units: readonly { readonly unitID: string }[];
}
