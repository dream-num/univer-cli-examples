# 06 Resource-backed Slide

English | [简体中文](./README.zh-CN.md)

This example turns an ordinary SVG into one reviewable Univer Slide page. Resource Library exports
a stable visual asset, the SVG compiler produces disposable Facade JavaScript, and the Worktree
runtime commits the result for structured and visual review.

```text
stable handle → exported SVG asset → page.svg → compile-svg → execute → Review Evidence
```

The example retains every command from `04-worktree`; this guide follows only the new one-page
authoring path.

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

univer-example-cli resources find rocket \
  --registry example-tabler-outline --json
univer-example-cli resources export example-tabler-outline/rocket \
  --out authoring/resources --json

univer-example-cli compile-svg authoring/page.svg --page 1 \
  --out .generated/page.js --estimate-text-size --json
```

The compile result must report a `960 × 540` viewport, page `1`, `builtin-estimate`, no warnings,
and only the expected text-estimation lint. A missing exported asset stops compilation and names
`resources/example-tabler-outline--rocket.svg`.

Create a Slide Worktree and apply the generated replacement:

```bash
UNIT_ID=$(univer-example-cli create slide --name "Product release status")
WORKTREE_ID=$(univer-example-cli worktree create --unit "$UNIT_ID")

univer-example-cli execute --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --file .generated/page.js
```

Continue only when execution reports `commit: "confirmed"`. Collect all Review Evidence before
handoff:

```bash
univer-example-cli inspect slide index:1 \
  --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --json
univer-example-cli lint --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1 --json
univer-example-cli screenshot --unit "$UNIT_ID" --worktree "$WORKTREE_ID" \
  --pages 1 --out output --json
```

Require zero layout findings, then open the PNG and check alignment, hierarchy, contrast, resource
rendering, and content completeness. Fix `authoring/page.svg` and repeat replace compile/execute;
do not use `--add` for corrections.

When the evidence passes:

```bash
univer-example-cli worktree ready "$WORKTREE_ID"
univer-example-cli open --unit "$UNIT_ID" --worktree "$WORKTREE_ID" --no-launch
```

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

This example covers one Slide page. It does not add multi-page decks, charts, tables, templates,
PPTX export, or handwritten Facade drawing code.
