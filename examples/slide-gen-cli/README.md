# Slide Gen CLI

English | [简体中文](./README.zh-CN.md)

This Slide-only example turns a Presentation Brief into a reviewable Univer deck. The committed
Authoring Source contains a deck spec, consecutive SVG pages, stable-handle resources, and optional
programs for editable native charts and tables. Generated Facade JavaScript remains disposable.

```text
Presentation Brief → deck spec → SVG pages → compile/execute → evidence → Ready review
                                      ↘ optional native enhancement replay
```

## Run the Baseline Deck

Run from this directory:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm link-cli
pnpm start-server
```

Keep the Server running. In another terminal, compile the two committed 960 × 540 pages:

```bash
TASK_DIR=authoring/product-release
mkdir -p "$TASK_DIR/.generated" "$TASK_DIR/output"

slide-gen-cli compile-svg "$TASK_DIR/pages/page-01-status.svg" --page 1 \
  --out "$TASK_DIR/.generated/page-01.js" --estimate-text-size --json
slide-gen-cli compile-svg "$TASK_DIR/pages/page-02-handoff.svg" --page 2 \
  --out "$TASK_DIR/.generated/page-02.js" --estimate-text-size --json
```

Page 1 uses the committed canonical rocket export; page 2 shows that a page does not need a
resource reference. Stop on compiler warnings and review each reported lint.

Create one Slide Worktree and execute pages consecutively:

```bash
UNIT_ID=$(slide-gen-cli create --name "Product release deck")
WORKTREE_ID=$(slide-gen-cli worktree create --unit "$UNIT_ID")

slide-gen-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --file "$TASK_DIR/.generated/page-01.js"
slide-gen-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --file "$TASK_DIR/.generated/page-02.js"
```

Each execution must report `commit: "confirmed"`. Recompiling an existing page number replaces
that page; `pageCount + 1` appends the next page; skipping a page number fails instead of creating
blank pages. The workflow sets no maximum page count.

## Review and deliver

Save structured inspection, layout diagnostics, and a screenshot for every page:

```bash
slide-gen-cli inspect presentation \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
slide-gen-cli inspect slide index:1 \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
slide-gen-cli inspect slide index:2 \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
slide-gen-cli lint --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1,2 --json
slide-gen-cli screenshot --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1,2 --out "$TASK_DIR/output" --json
```

Require zero unexplained layout findings. Read every PNG, then review narrative continuity, fonts,
colors, resource style, page size, and native-element placement across the deck. Fix a page by
compiling and executing its page number again; do not use `--add` for corrections.

If a page needs an editable native chart or table, run its saved enhancement program only after
the last SVG replacement. Charts must set explicit category and value field mappings. Replay the
enhancement after any later replacement of that page.

When the evidence passes:

```bash
slide-gen-cli worktree ready "$WORKTREE_ID"
slide-gen-cli open --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --no-launch
slide-gen-cli export "$TASK_DIR/output/product-release.pptx" \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

The review URL is scoped to this Server and works while it is running. PPTX export is optional;
export the same Worktree revision that the reviewer accepted. Before handing off a PPTX with native
charts or tables, inspect exporter diagnostics and verify that its OOXML preserves chart
category/value data, includes the embedded workbook, and contains the native table in slide XML;
do not return only the file path.

## Use it with an Agent

```bash
pnpm skill:install
```

Open this directory with an Agent and enter:

```text
Use univer-slide-authoring to turn my Presentation Brief into a reviewed Slide Worktree.
```

When finished:

```bash
pnpm skill:uninstall
pnpm unlink-cli
```

## Files and boundaries

- `authoring/product-release/` is one committed task-directory example, not a required location.
- A task directory keeps `deck.md`, `pages/`, `resources/`, and optional `enhancements/` together.
- Put `.generated/` and `output/` under that same task directory; both are disposable and ignored.
- Use a different task directory for each concurrent or resumable deck job. `.data/` and `dist/`
  remain application-level disposable output.
- `test/program.test.ts`, `test/smoke.test.ts`, and `test/native.test.ts` use fixed inputs and local
  assets, so automated verification does not contact the remote asset host.

The application excludes Sheet and Doc authoring, Office import, templates, hosted publishing, and
handwritten Facade drawing code for ordinary elements.
