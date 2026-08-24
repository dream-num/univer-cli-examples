---
name: univer-content
description: Import, create, edit, visually verify, and export a collaborative Univer Sheet, Doc, or Slide when the user asks to work with Office content.
---

# Work with Univer Content

Use `univer-example-cli <command>`. The user starts the Server separately with
`pnpm start-server` from the current `03-visual-inspection` directory.

## Workflow

1. If the user provides an `.xlsx`, `.docx`, or `.pptx` file, run
   `univer-example-cli import <file>`; otherwise run
   `univer-example-cli create <type> --name <name>`. Retain the returned `unitId`.
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
7. Capture the result with `univer-example-cli screenshot --unit <unitId> --out output`. A Sheet
   range can add `--sheet <name> --range <range>`; selected Slide pages can add `--pages <pages>`.
8. For a Slide, also run `univer-example-cli lint --unit <unitId>`. Treat findings as visual review
   evidence and fix clear layout problems before capturing again.
9. Read every PNG with image input and check clipping, overlap, missing content, and obvious layout
   problems. Visual verification is complete only after an image-capable model has read the PNG. If
   image input is unavailable, return the screenshot path and report visual verification as pending.
   When the user requests an Office file, run `univer-example-cli export <file> --unit <unitId>`
   with the matching file extension.
10. Run `univer-example-cli open --unit <unitId> --no-launch` and return the Unit type, name,
    `unitId`, revision, screenshot path, exported path when present, and URL. Open the browser only
    when the user asks.
