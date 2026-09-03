---
name: univer-slide-authoring
description: Turn a Presentation Brief into a reviewable Univer Slide deck with SVG pages, optional editable native charts and tables, and per-page evidence.
---

# Author a Univer Slide deck

Use `slide-gen-cli <command>`. The user starts the Server separately with
`pnpm start-server` from the current `slide-gen-cli` directory.

Choose one dedicated task directory for each deck. The user may supply its location; otherwise pick
a writable location in the current workspace. Do not reuse a task directory across concurrent or
resumable deck jobs. This layout is an example, not a required path:

```text
<task-dir>/
  deck.md
  pages/page-NN-*.svg
  resources/<registry>--<resource>.svg
  enhancements/page-NN-*.js  # optional native programs
  .generated/page-NN.js       # disposable
  output/                     # disposable review and export files
```

## Workflow

1. Write the deck spec before drawing: audience, decision, narrative, page sequence, exact copy,
   960 × 540 layout, colors, font roles, and asset meanings. The page number uses two digits for
   sorting; the deck has no fixed maximum page count.
2. Create a Slide with `slide-gen-cli create --name <name>`, then create a Worktree. Retain both IDs
   for every later command. Use `api find|show --unit slide` when you need Facade reference.
3. Find resources by meaning with `resources find`, then export canonical handles with
   `resources export ... --out <task-dir>/resources`. At least one page in the deck must reference a
   stable-handle resource; other pages may omit resources. Reference an export by its
   `<registryId>--<resourceId>.svg` name. Do not copy path data, substitute Unicode glyphs, or invent
   placeholder icons.
4. Author ordinary shape, text, and image content as SVG. Use inline styles and document order for
   stacking. Every `<image>` needs width and height. Use positioned elements instead of repeated
   spaces; multiline text uses `<tspan>` with scalar `x` and absolute `y` or non-zero `dy`. Use
   fractional object-bounding-box gradient coordinates. Avoid filters, masks, translucent
   gradients, and radial gradients on non-square shapes.
5. Generate pages consecutively from 1 through N. Compile each source with:

   ```bash
   slide-gen-cli compile-svg <task-dir>/pages/page-01-title.svg --page 1 \
     --out <task-dir>/.generated/page-01.js --estimate-text-size --json
   ```

   Stop on compiler errors or warnings. Review every lint; the deterministic text-estimation lint
   is expected, while any other surviving lint needs an explicit reason.

6. Execute each generated program against the same Unit and Worktree. Page 1 through N builds the
   initial deck. Executing an existing page number replaces that page; executing `pageCount + 1`
   appends; skipping a number is an error. Continue only when every result reports
   `commit: "confirmed"`.
7. If the deck needs editable native charts or tables, keep them in a separate saved enhancement
   program. Give each chart explicit category and value field mappings. Run enhancements only after
   the final SVG replacement for their page, and replay them whenever a later replacement removes
   those native elements. SVG charts and tables need no enhancement.
8. For every page, save compiler diagnostics and structured inspection under the task directory,
   run layout lint, capture a PNG under `<task-dir>/output`, and read it. Require zero unexplained
   layout findings. Check clipping, overflow, wrapping,
   overlap, alignment, contrast, missing content, and stacking. Then review the whole deck for
   narrative continuity, font and color consistency, resource style, page size, and native-element
   placement.
9. Fix the SVG source and repeat replacement, enhancement replay, inspection, lint, and screenshot
   review until the evidence passes. Do not use `--add` for corrections because it leaves broken
   elements under the replacements.
10. Mark the Worktree Ready and print its Server-scoped review URL with `open --no-launch`. If the
    user requests a file, export the same Worktree revision with
    `export <task-dir>/output/<file.pptx> --unit <unitId> --worktree <worktreeId>`. For a PPTX with native charts or
    tables, inspect exporter diagnostics and verify that the OOXML preserves chart category/value
    data, includes the embedded workbook, and contains the native table in slide XML. Return the
    Unit ID, Worktree ID, revision, authoring paths, evidence paths, accepted lints, review URL, and
    optional PPTX path; do not hand off only the file path.

Do not add Sheet or Doc authoring, Office import, a template system, or handwritten Facade drawing
code for ordinary elements. The Server owns review URLs; the workflow does not publish them.
