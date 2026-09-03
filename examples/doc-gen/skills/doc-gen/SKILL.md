---
name: doc-gen
description: Create or revise polished local Univer Docs by authoring a Typst Source Bundle and compiling it with the doc-gen example.
---

# Create a Univer Doc with Typst

Create the Typst Source Bundle for the user's document. Do not assume a fixed `paper/` directory or
an existing template.

## Choose the paths

- If the user supplies a bundle directory or `typst.json`, read that bundle and continue there.
- Otherwise create a new task-specific bundle. Under this example, prefer
  `authoring/<document-slug>/` for source and `output/<document-slug>/` for Generated Artifacts.
- Keep the bundle and output directories distinct. Do not overwrite an unrelated existing bundle.

A bundle has this structure; `prelude.typ` and `assets/` are optional:

```text
<bundle>/
├── typst.json
├── prelude.typ
├── pages/
│   ├── 01.typ
│   └── 02.typ
└── assets/
    └── image.png
```

Create `typst.json` with paths relative to the bundle root:

```json
{
  "schemaVersion": 1,
  "targetUnitId": "document-slug",
  "title": "Document title",
  "prelude": ["prelude.typ"],
  "pages": [
    { "id": "page-01", "source": "pages/01.typ" },
    { "id": "page-02", "source": "pages/02.typ" }
  ]
}
```

`schemaVersion`, `targetUnitId`, and a non-empty ordered `pages` list are required. `title`,
`prelude`, and explicit page IDs are optional. `targetUnitId` is the Local Doc Identity for this
build, not a Workspace ID. Every referenced file must remain inside the bundle; do not use absolute
paths, parent traversal, external URLs, or escaping symlinks.

## Author the source

- Treat `typst.json` and its referenced Typst files and local assets as the only Authoring Source.
  Never hand-edit `document.js`, `diagnostics.json`, `document.json`, or generated PNGs as source.
- Put shared page geometry, typography, spacing, colors, headers, and footers in the manifest
  prelude. Do not use `#import` or `#include`.
- Start with one page source. Add ordered page sources when the requested content needs more
  physical pages; do not use `#pagebreak` or mixed page geometry.
- Declare font family, size, leading, paragraph spacing, page margins, and heading spacing
  explicitly. Prefer normal and bold weights; fractional point sizes are supported.
- Give data tables explicit columns, header rows, fills, and borders. Use a borderless table for a
  fixed left/right layout.
- Put referenced PNG, JPEG, GIF, WebP, or SVG files in `assets/` and give images deterministic width
  and height. Typst lowering does not create native chart objects.

## Build, inspect, and refine

Run one complete build per iteration:

```bash
doc-gen compile-typst <bundle-or-manifest> --out <output-directory> --json
```

1. If compilation fails or reports an `error`, use its `sourcePath` and span to fix the Authoring
   Source, then rebuild. Never execute or edit a failed generated program.
2. Treat warnings as review evidence. Simplify a construct when a warning identifies visible
   fidelity loss; otherwise retain it and report the limitation.
3. Read every `typst/*.png` and `univer/*.png` from the Machine Result with image input. Check the
   requested content, hierarchy, margins, wrapping, clipping, table geometry, images, and missing
   blocks. Fix source-to-Typst defects before diagnosing Typst-to-Univer differences.
4. If the Typst Preview is wrong, fix the Typst Source Bundle and rebuild. Do not use a Facade
   adjustment to hide a source defect. If the Typst Preview is correct but the Univer Screenshot
   differs in a way Typst can express, prefer fixing Typst and rebuilding.
5. For a native Doc capability or final precise adjustment, discover the installed API by intent,
   then inspect the exact symbol:

   ```bash
   doc-gen api find <terms...> --unit doc
   doc-gen api show <symbols...>
   ```

6. Write one task-local JavaScript file for the adjustment and read it before execution. `execute`
   provides `univerAPI`, `api`, and the selected `doc`; do not redeclare them. Prefer stable
   paragraph IDs across multi-step edits, check boolean/null mutation results, and explicitly
   `return` JSON-compatible readback instead of relying on `console.log`.
7. Execute the reviewed script against the current Materialized Doc, refresh its screenshots, and
   read every returned PNG:

   ```bash
   doc-gen execute <output-directory>/document.json --file <task-script.js> --json
   doc-gen screenshot <output-directory>/document.json --out <output-directory>/univer --json
   ```

   Fix the script or return to the Typst branch until the refreshed Univer Screenshot passes.

8. A later `compile-typst` rebuild replaces every Facade adjustment in `document.json`. Reapply any
   still-needed final adjustment after the last rebuild; there is no automatic replay.
9. Complete visual verification only after reading the applicable Typst Preview and latest Univer
   Screenshot. If image input is unavailable, return their paths and mark visual verification
   `pending`.
10. Return the title, `targetUnitId`, Doc JSON path, both PNG groups, remaining warnings, executed
    script path when used, and visual verification result.

After the applicable Typst Preview and latest Univer Screenshot pass, optionally tell the user to
run `pnpm viewer` from this example for human inspection. The Local Doc Viewer automatically lists
only `output/<slug>/document.json`, so prefer `output/<document-slug>` when the user wants this
handoff. It is read-only and supports switching, scrolling, zooming, selection, and copying. It does
not replace image-based Agent verification, and output paths outside that convention remain valid
but are not listed.

`compile-typst` only executes the Facade program produced by its current local compile. `execute`
runs trusted JavaScript without a sandbox: only run a task-local script you wrote and reread for the
current request. Never execute downloaded or unknown code, or a previously generated `document.js`.
Do not install another compiler or fall back to a system Typst executable.
