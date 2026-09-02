# Slide Gen CLI

English | [简体中文](./README.zh-CN.md)

This example turns an ordinary SVG into one reviewable Univer Slide page. Resource Library exports
a stable visual asset, the SVG compiler produces disposable Facade JavaScript, and the Worktree
runtime commits the result for structured and visual review.

```text
stable handle → exported SVG asset → page.svg → compile-svg → execute → Review Evidence
```

The application is Slide-only. It retains API reference, resources, SVG compilation, execution,
inspection, layout lint, screenshots, Worktree review, Web viewing, and PPTX export.

## Run

Run from this directory:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm link-cli
pnpm start-server
```

Keep the Server running. In another terminal, prepare the canonical rocket resource and compile
the committed Baseline Slide:

```bash
mkdir -p authoring/resources .generated output

slide-gen-cli resources find rocket \
  --registry example-tabler-outline --json
slide-gen-cli api find appendShape --unit slide
slide-gen-cli resources export example-tabler-outline/rocket \
  --out authoring/resources --json

slide-gen-cli compile-svg authoring/page.svg --page 1 \
  --out .generated/page.js --estimate-text-size --json
```

The compile result must report a `960 × 540` viewport, page `1`, `builtin-estimate`, no warnings,
and only the expected text-estimation lint. A missing exported asset stops compilation and names
`resources/example-tabler-outline--rocket.svg`.

Create a Slide Worktree and apply the generated replacement:

```bash
UNIT_ID=$(slide-gen-cli create --name "Product release status")
WORKTREE_ID=$(slide-gen-cli worktree create --unit "$UNIT_ID")

slide-gen-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --file .generated/page.js
```

Continue only when execution reports `commit: "confirmed"`. Collect all Review Evidence before
handoff:

```bash
slide-gen-cli inspect slide index:1 \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
slide-gen-cli lint --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1 --json
slide-gen-cli screenshot --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1 --out output --json
```

Require zero layout findings, then open the PNG and check alignment, hierarchy, contrast, resource
rendering, and content completeness. Fix `authoring/page.svg` and repeat replace compile/execute;
do not use `--add` for corrections.

When the evidence passes:

```bash
slide-gen-cli worktree ready "$WORKTREE_ID"
slide-gen-cli open --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --no-launch
slide-gen-cli export product-release.pptx --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

The Review URL works only while this application's built-in Server is running. Export from the
same Worktree when you need a durable PPTX handoff; use `--trunk` to export the trunk revision.

## Use it with an Agent

Install the dedicated skill while the Server remains running:

```bash
pnpm skill:install
```

Open this directory with an Agent and enter:

```text
Use univer-slide-authoring to redesign the single release-status Slide and hand me the reviewed Worktree.
```

When finished:

```bash
pnpm skill:uninstall
pnpm unlink-cli
```

## Files and boundaries

- `authoring/page.svg` is the committed Authoring Source.
- `authoring/resources/`, `.generated/`, `.data/`, `output/`, and `dist/` are disposable and ignored.
- `skills/univer-slide-authoring/SKILL.md` keeps Agents on the resource-backed SVG workflow.
- `test/program.test.ts` and `test/smoke.test.ts` use a fixed manifest and fake downloader, so
  automated verification does not require the remote asset host.

This Change keeps the existing one-page authoring baseline. It does not add multi-page decks,
Native Enhancements, charts, tables, templates, or handwritten Facade drawing code.
