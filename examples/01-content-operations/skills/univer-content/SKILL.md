---
name: univer-content
description: Create and edit a collaborative Univer Sheet, Doc, or Slide when the user asks for a spreadsheet, document, or presentation with specified content.
---

# Work with Univer Content

Use `univer-example-cli <command>`. The user starts the Server separately with
`pnpm start-server` from the current `01-content-operations` directory.

## Workflow

1. Choose `sheet`, `doc`, or `slide` from the request. Run
   `univer-example-cli create <type> --name <name>` and retain the returned `unitId`.
2. Inspect the new Unit with `inspect workbook` for Sheet, `inspect document` for Doc, or
   `inspect presentation` for Slide. Pass `--unit <unitId>`.
3. Before using an unfamiliar Facade API, query it with `univer-example-cli api find <term>` and
   `univer-example-cli api show <symbol>`. Execution code uses the provided `workbook` for a Sheet,
   `doc` for a Doc, or `presentation` for a Slide. These binding names are reserved; use them
   directly. Sheet code starts with `const sheet = workbook.getActiveSheet()`.
4. One-shot boundary: run the complete trusted change exactly once with
   `univer-example-cli execute --unit <unitId> --code <javascript>` or `--file <path>`. Successful
   execution commits automatically.
5. When the returned JSON contains `commit: "confirmed"`, retain its revision and continue. For any
   other result, stop and return that result.
6. Inspect the changed content with `--json`. For a Sheet range, run
   `univer-example-cli inspect range <range> --worksheet index:1 --unit <unitId> --json`.
7. Run `univer-example-cli open --unit <unitId> --no-launch` and return the Unit type, name,
   `unitId`, revision, and URL. Open the browser only when the user asks.
