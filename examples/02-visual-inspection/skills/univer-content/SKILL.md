---
name: univer-content
description: Create, edit, and visually verify a collaborative Univer Sheet, Doc, or Slide when the user asks for a spreadsheet, document, or presentation with specified content.
---

# Work with Univer Content

Use `pnpm start <command>` from the current `02-visual-inspection` directory. The user starts the
Server separately with `pnpm server`.

## Workflow

1. Choose `sheet`, `doc`, or `slide` from the request. Run
   `pnpm start create <type> --name <name>` and retain the returned `unitId`.
2. Inspect the new Unit with the matching overview target: `workbook`, `document`, or
   `presentation`.
3. Before using an unfamiliar Facade API, query it with `api find` and `api show`. Execution code
   receives `workbook` for a Sheet, `doc` for a Doc, and `presentation` for a Slide.
4. Run `pnpm start execute` once with the complete trusted Facade JavaScript change.
5. Require `commit: "confirmed"`, retain the returned revision, and do not retry a failed commit.
6. Inspect the changed range, paragraph, or slide with `--json` and verify the requested content.
7. Capture the result with `pnpm start screenshot --unit <unitId> --out output`. A Sheet range can
   add `--sheet <name> --range <range>`; selected Slide pages can add `--pages <pages>`.
8. Inspect the PNG, then run `pnpm start open --no-launch` and return the Unit type, name, `unitId`,
   revision, screenshot path, and URL. Open the browser only when the user asks.
