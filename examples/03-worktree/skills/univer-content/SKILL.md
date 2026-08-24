---
name: univer-content
description: Create, edit, and verify a collaborative Univer Sheet, Doc, or Slide in an isolated Worktree when the user asks for content that should be handed off for review.
---

# Work with Univer Content

Use `univer-example-cli <command>`. The user starts the Server separately with
`pnpm start-server` from the current `03-worktree` directory.

## Workflow

1. Choose `sheet`, `doc`, or `slide`. Create the trunk Unit, then run
   `univer-example-cli worktree create --unit <unitId>` and retain both returned IDs.
2. Inspect the Worktree with the matching overview target: `workbook`, `document`, or
   `presentation`. Use `--trunk` only when a baseline or final trunk view is useful.
3. Before using an unfamiliar Facade API, query `univer-example-cli api find` and
   `univer-example-cli api show`.
4. Execute the complete trusted Facade JavaScript with `--worktree <worktreeId>`. Content edits in
   this example always target the Worktree.
5. Require `commit: "confirmed"`, retain the revision, and do not retry a failed commit.
6. Inspect the changed range, paragraph, or slide in the Worktree with `--json` and verify the
   requested content.
7. Capture the Worktree with `screenshot --worktree <worktreeId> --out output`. For a Slide, also run
   `lint --worktree <worktreeId>` and fix clear layout problems before capturing again.
8. Run `univer-example-cli worktree ready <worktreeId>`, then
   `univer-example-cli open --unit <unitId> --worktree <worktreeId> --no-launch`.
9. Return the Unit type, name, Unit ID, Worktree ID, revision, screenshot paths, and review URL. Open
   the browser only when the user asks.
