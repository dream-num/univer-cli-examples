---
name: univer-content
description: Author and visually verify a polished local Univer Doc from the Typst Source Bundle in the 07 Typst Doc authoring example.
---

# Author a Univer Doc with Typst

Edit the tracked Typst Source Bundle, then run:

```bash
univer-example-cli compile-typst paper --out output --json
```

This example creates one local Materialized Doc. It does not use a Server, Worktree, remote Unit, or system Typst executable.

## Source boundaries

- Treat `paper/typst.json`, its manifest-declared prelude, and ordered page sources as authoritative. Never edit `document.js`, `diagnostics.json`, `document.json`, or generated PNGs.
- Keep shared page geometry, typography, spacing, colors, header, and footer in `paper/prelude.typ`. Do not use `#import` or `#include`.
- Keep the document to one A4 page. Do not add images, charts, `#pagebreak`, dynamic page numbers, mixed page geometry, external URLs, or files outside the bundle.
- Use normal and bold text weights. Declare font family, size, leading, paragraph spacing, page margins, and heading spacing explicitly; fractional point sizes are allowed.
- Give data tables explicit columns, header rows, fills, and borders. Use a borderless table for a fixed left/right layout.

## Workflow

1. Read the request and all files in the current Typst Source Bundle. Set an appropriate manifest title and Local Doc Identity, then make the smallest source edits that express the requested content and hierarchy.
2. Run the complete command once for the iteration. It compiles, materializes the Doc, and renders the Univer Screenshot from the same compile result.
3. If the command fails or a diagnostic has severity `error`, use its `sourcePath` and span to fix the Typst source, then rerun. Never execute or edit a failed generated program.
4. Treat warnings as review evidence. Simplify a construct when a warning identifies visible fidelity loss; otherwise retain it and report the limitation.
5. Read every Typst Preview and every Univer Screenshot with image input. Check requested text, hierarchy, margins, wrapping, clipping, table geometry, and missing content. Fix source-to-Typst defects before diagnosing Typst-to-Univer differences.
6. Complete visual verification only after an image-capable model reads both PNG groups. If image input is unavailable, return their paths and mark visual verification `pending`.
7. Return the title, `targetUnitId`, Doc JSON path, both PNG groups, remaining warnings, and visual verification result.

Only execute the Facade program produced by the local compiler in the current command. Do not run an existing JavaScript file or install another compiler.
