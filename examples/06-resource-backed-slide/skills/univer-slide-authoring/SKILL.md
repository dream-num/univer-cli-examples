---
name: univer-slide-authoring
description: Create or redesign one reviewable Univer Slide page from SVG and Resource Library assets in the 06-resource-backed-slide example.
---

# Author one Univer Slide page

Use `univer-example-cli <command>`. The user starts the Server separately with
`pnpm start-server` from the current `06-resource-backed-slide` directory.

Keep the editable source in `authoring/page.svg`, exported assets in
`authoring/resources/`, generated code in `.generated/`, and screenshots in `output/`.

## Workflow

1. Fix the page's exact copy, one core message, 960 × 540 layout, colors, font roles, and required
   asset meanings before drawing. This example produces one page only.
2. Create a Slide Unit and Worktree. Retain both IDs for every later command.
3. Create `authoring/resources/`, `.generated/`, and `output/`. Find assets by meaning with
   `resources find`, then export canonical handles with
   `resources export ... --out authoring/resources`. Keep one registry/style baseline. Reference
   the exported file by its `<registryId>--<resourceId>.svg` name; do not copy its path data,
   substitute Unicode glyphs, or invent placeholder icons.
4. Author the complete page as ordinary SVG. Use inline styles and document order for stacking.
   Every `<image>` needs width and height. Use positioned elements instead of repeated spaces;
   multiline text uses `<tspan>` with scalar `x` and absolute `y` or non-zero `dy`. Use fractional
   object-bounding-box gradient coordinates. Avoid filters, masks, translucent gradients, and
   radial gradients on non-square shapes.
5. Compile page 1 with:

   ```bash
   univer-example-cli compile-svg authoring/page.svg --page 1 \
     --out .generated/page.js --estimate-text-size --json
   ```

   Stop on every compiler error or warning. Review every lint; the deterministic text-estimation
   lint is expected, while any other surviving lint needs an explicit reason.

6. Apply the generated program once with
   `univer-example-cli execute --unit <unitId> --worktree <worktreeId> --file .generated/page.js`.
   Continue only when the result reports `commit: "confirmed"`; otherwise return the result and
   stop.
7. Inspect `slide index:1`, run layout lint for page 1, capture its screenshot, and read the PNG.
   Check clipping, text overflow or wrapping, text overlap, alignment, sibling icon sizing,
   contrast, missing content, and stacking. Treat each lint as a defect until its evidence shows an
   intentional overlap.
8. Fix `authoring/page.svg`, then compile and execute the replacement again. Never use `--add` for
   rework because it leaves broken elements under the replacements. Repeat inspection, lint, and
   screenshot review until warnings are zero and every lint is fixed or justified.
9. Mark the Worktree Ready and print its review URL with `open --no-launch`. Return the Unit ID,
   Worktree ID, revision, SVG and exported-asset paths, accepted lints, screenshot path, and review
   URL. Open the browser only when the user asks.

Do not hand-write Facade drawing code, add pages, charts or tables, build a template system, or
replace final screenshot review with the SVG browser preview.
