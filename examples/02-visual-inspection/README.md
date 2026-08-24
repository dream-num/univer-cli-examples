# 02 Visual Inspection

English | [简体中文](./README.zh-CN.md)

This example keeps the SQLite-backed Sheet, Doc, and Slide Server, Web file sidebar, and CLI flow
from 01, then adds
screenshots. It pulls the latest UnitData from the Server, passes it to a browser-backed Render
Runtime, and writes PNG files.

```text
01 Content Operations + Render Page + Screenshot → PNG
```

## Run

After entering this example, run every command from the current directory:

```bash
corepack enable
pnpm install
pnpm build
pnpm server
```

Use another terminal in the same directory to create and capture a Unit:

```bash
pnpm start create sheet --name "Visual Demo"
pnpm start screenshot --unit <unit-id> --sheet Data --range A1:B2 --out output
```

For a Doc, omit the Sheet selectors. For a Slide, optionally select pages:

```bash
pnpm start screenshot --unit <doc-id> --out output
pnpm start screenshot --unit <slide-id> --pages 1 --out output
```

The `create`, `inspect`, `execute`, `open`, and `api` commands from 01 remain unchanged.

## What changed from 01

Added files:

- `src/cli/features/visual.ts` assembles the screenshot preset, loads the latest UnitData, and
  writes PNG files.
- `src/render-page/index.html` and `src/render-page/main.ts` provide the minimal page loaded by the
  Render Runtime.
- `vite.render.config.ts` builds the Render Page separately.

Changed files:

- `src/cli/program.ts` adds `screenshot` after the commands from 01.
- `package.json` adds Screenshot, Render Runtime, and Render Page dependencies and builds the second
  page.
- `skills/univer-content/SKILL.md` adds visual confirmation after content verification.
- `test/smoke.test.ts` keeps the complete three-Unit smoke path from 01 and verifies generated PNGs.

The remaining `src/cli/features/`, `src/server/`, `src/shared/`, and `src/web/` stay identical to 01.

Run `pnpm check` to verify this example.

This example adds only screenshots. Layout lint remains a later teaching step.
