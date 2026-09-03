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
  Never edit `document.js`, `diagnostics.json`, `document.json`, or generated PNGs as source.
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

## Build and verify

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
4. Complete visual verification only after reading both PNG groups. If image input is unavailable,
   return their paths and mark visual verification `pending`.
5. Return the title, `targetUnitId`, Doc JSON path, both PNG groups, remaining warnings, and visual
   verification result.

The command only executes the Facade program produced by its current local compile. Do not run an
existing JavaScript file, install another compiler, or fall back to a system Typst executable.
