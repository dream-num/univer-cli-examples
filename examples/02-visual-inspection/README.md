# 02 Visual Inspection

English | [简体中文](./README.zh-CN.md)

This example keeps the SQLite-backed Sheet, Doc, and Slide Server, Web file sidebar, and CLI flow
from 01, then adds visual inspection. It pulls the latest UnitData from the Server, passes it to a
browser-backed Render Runtime, and writes PNG files.

```text
01 Content Operations + Render Page + Screenshot → PNG
```

## Run

After entering this example, run every command from the current directory:

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

Use another terminal in the same directory to create and capture a Unit:

```bash
SHEET_ID=$(univer-example-cli create sheet --name "Visual Demo")
univer-example-cli screenshot --unit "$SHEET_ID" --sheet Data --range A1:B2 --out output
```

For a Doc, omit the Sheet selectors. For a Slide, optionally select pages:

```bash
DOC_ID=$(univer-example-cli create doc --name "Visual Doc")
univer-example-cli screenshot --unit "$DOC_ID" --out output

SLIDE_ID=$(univer-example-cli create slide --name "Visual Slide")
univer-example-cli screenshot --unit "$SLIDE_ID" --pages 1 --out output
```

Slide can also report text overflow and overlap. This is a small addition to the same visual flow:

```bash
univer-example-cli lint --unit "$SLIDE_ID" --pages 1
```

When finished, run `pnpm unlink-cli`.

The `create`, `inspect`, `execute`, `open`, and `api` commands from 01 remain unchanged.

## What changed from 01

Added files:

- `src/cli/features/visual.ts` assembles the screenshot and layout lint presets, loads the latest
  UnitData, and writes PNG files.
- `src/render-page/index.html` and `src/render-page/main.ts` provide the minimal page loaded by the
  Render Runtime.
- `vite.render.config.ts` builds the Render Page separately.

Changed files:

- `src/cli/program.ts` adds `screenshot` and `lint` after the commands from 01.
- `package.json` adds the visual inspection and rendering dependencies and builds the second page.
- `skills/univer-content/SKILL.md` adds visual confirmation after content verification.
- `test/smoke.test.ts` keeps the complete three-Unit smoke path from 01 and verifies generated PNGs.

The remaining `src/cli/features/`, `src/server/`, `src/shared/`, and `src/web/` stay identical to 01.

Run `pnpm check` to verify this example.

Layout lint currently applies only to Slide. Its findings are review evidence, not errors that must
always be reduced to zero.
