---
name: univer-content
description: Import, create, edit, verify, and export a collaborative Univer Sheet, Doc, or Slide when the user asks to work with Office content.
---

# Work with Univer Content

Use `univer-example-cli <command>`. The user starts the Server separately with
`pnpm start-server` from the current `02-file-exchange` directory.

## Workflow

1. If the user provides an `.xlsx`, `.docx`, or `.pptx` file, run
   `univer-example-cli import <file>`; otherwise run
   `univer-example-cli create <type> --name <name>`. Retain the returned `unitId`.
2. Inspect the new Unit with the matching overview target: `workbook`, `document`, or
   `presentation`.
3. Before using an unfamiliar Facade API, query it with `univer-example-cli api find` and
   `univer-example-cli api show`. Execution code receives `workbook` for a Sheet, `doc` for a Doc,
   and `presentation` for a Slide.
4. Run `univer-example-cli execute` once with the complete trusted Facade JavaScript change.
5. Require `commit: "confirmed"`, retain the returned revision, and do not retry a failed commit.
6. Inspect the changed range, paragraph, or slide with `--json` and verify the requested content.
7. When the user requests an Office file, run `univer-example-cli export <file> --unit <unitId>`
   using `.xlsx` for Sheet, `.docx` for Doc, or `.pptx` for Slide.
8. Run `univer-example-cli open --no-launch` and return the Unit type, name, `unitId`, revision,
   exported path when present, and URL. Open the browser only when the user asks.
