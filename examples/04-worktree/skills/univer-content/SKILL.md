---
name: univer-content
description: Import or create, edit, verify, and export a collaborative Univer Sheet, Doc, or Slide in an isolated Worktree when the user asks for content that should be handed off for review.
---

# Work with Univer Content

Use `univer-example-cli <command>`. The user starts the Server separately with
`pnpm start-server` from the current `04-worktree` directory.

## Workflow

1. If the user provides an `.xlsx`, `.docx`, or `.pptx` file, import it; otherwise create a Sheet,
   Doc, or Slide. Then run `univer-example-cli worktree create --unit <unitId>` and retain both IDs.
2. Inspect the Worktree with `inspect workbook` for Sheet, `inspect document` for Doc, or
   `inspect presentation` for Slide. Pass `--unit <unitId> --worktree <worktreeId>`. Use `--trunk`
   only when a baseline or final trunk view is useful.
3. Before using an unfamiliar Facade API, query `univer-example-cli api find <term>` and
   `univer-example-cli api show <symbol>`. Execution code uses the provided `workbook` for a Sheet,
   `doc` for a Doc, or `presentation` for a Slide. These binding names are reserved; use them
   directly. Sheet code starts with `const sheet = workbook.getActiveSheet()`.
4. One-shot boundary: run the complete trusted change exactly once with
   `univer-example-cli execute --unit <unitId> --worktree <worktreeId> --code <javascript>` or
   `--file <path>`. Successful execution commits automatically.
5. When the returned JSON contains `commit: "confirmed"`, retain its revision and continue. For any
   other result, stop and return that result.
6. Inspect the changed content in the Worktree with `--json`. For a Sheet range, run
   `univer-example-cli inspect range <range> --worksheet index:1 --unit <unitId> --worktree
<worktreeId> --json`.
7. When the user requests visual verification, capture with
   `univer-example-cli screenshot --unit <unitId> --worktree <worktreeId> --out output` and read the
   PNG with image input. For a Slide, also run `lint --unit <unitId> --worktree <worktreeId>`.
8. When the user requests an Office file, export the draft with
   `univer-example-cli export <file> --unit <unitId> --worktree <worktreeId>`.
9. Run `univer-example-cli worktree ready <worktreeId>`, then
   `univer-example-cli open --unit <unitId> --worktree <worktreeId> --no-launch`.
10. Return the Unit type, name, Unit ID, Worktree ID, revision, screenshot and exported paths when
    present, and review URL. Open the browser only when the user asks.
