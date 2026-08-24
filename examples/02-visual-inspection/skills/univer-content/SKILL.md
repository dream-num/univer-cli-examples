---
name: univer-content
description: Create, edit, and visually verify a collaborative Univer Sheet, Doc, or Slide when the user asks for a spreadsheet, document, or presentation with specified content.
---

# Work with Univer Content

Use `univer-example-cli <command>`. The user starts the Server separately with
`pnpm start-server` from the current `02-visual-inspection` directory.

## Workflow

1. Choose `sheet`, `doc`, or `slide` from the request. Run
   `univer-example-cli create <type> --name <name>` and retain the returned `unitId`.
2. Inspect the new Unit with the matching overview target: `workbook`, `document`, or
   `presentation`.
3. Before using an unfamiliar Facade API, query it with `univer-example-cli api find` and
   `univer-example-cli api show`. Execution code receives `workbook` for a Sheet, `doc` for a Doc,
   and `presentation` for a Slide.
4. Run `univer-example-cli execute` once with the complete trusted Facade JavaScript change.
5. Require `commit: "confirmed"`, retain the returned revision, and do not retry a failed commit.
6. Inspect the changed range, paragraph, or slide with `--json` and verify the requested content.
7. Capture the result with `univer-example-cli screenshot --unit <unitId> --out output`. A Sheet
   range can add `--sheet <name> --range <range>`; selected Slide pages can add `--pages <pages>`.
8. For a Slide, also run `univer-example-cli lint --unit <unitId>`. Treat findings as visual review
   evidence and fix clear layout problems before capturing again.
9. Inspect the PNG, then run `univer-example-cli open --no-launch` and return the Unit type, name,
   `unitId`, revision, screenshot path, and URL. Open the browser only when the user asks.
