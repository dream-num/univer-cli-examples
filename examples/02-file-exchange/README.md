# 02 File Exchange

English | [简体中文](./README.zh-CN.md)

This example builds on 01 by adding Office file import and export to the same CLI, Web, and Server.
Exchange reads and writes local files in the CLI process. Imported Units are still persisted by the
Collaboration Server and can be opened directly in the Web editor.

```text
Office file ⇄ CLI Exchange ⇄ UnitData ⇄ Collaboration Server ⇄ Web
```

## Run

Run every command from this example directory:

```bash
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

Use another terminal in the same directory. This flow needs no prepared Office file: create a Sheet,
export it, then import the exported file as a new collaborative Unit.

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Exchange Demo")

univer-example-cli export demo.xlsx --unit "$UNIT_ID"

IMPORTED_ID=$(univer-example-cli import demo.xlsx --name "Imported Demo")

univer-example-cli inspect workbook --unit "$IMPORTED_ID" --json
univer-example-cli open --unit "$IMPORTED_ID"
```

Use `.xlsx` for Sheet, `.docx` for Doc, and `.pptx` for Slide. The input suffix selects the imported
Unit type; an export suffix must match the Unit type.

## Use it with an Agent

Keep the Server running and install the skill from another terminal:

```bash
pnpm skill:install
```

Open this directory with an Agent and enter:

```text
Use univer-content to import ./sales.xlsx, change the second-row sales amount to 1000, verify it, and export ./updated-sales.xlsx.
```

When finished, run:

```bash
pnpm skill:uninstall
pnpm unlink-cli
```

## What changed from 01

- `src/cli/features/file.ts` adds the application-level `import` and `export` commands.
- `import` uses `@univerjs-pro/exchange-node` to convert an Office file to UnitData, then creates the
  Unit through the existing Server API.
- `export` obtains the latest UnitData through Collaboration Runtime, then writes an Office file.
- The Server creation endpoint now accepts either blank-Unit parameters or converted UnitData.
- `@univerjs-pro/exchange-node-binding` provides the native conversion implementation for the current
  platform.

File exchange has no separate CLI SDK preset. `file.ts` is the smallest application adapter that
composes Exchange and Collaboration Runtime with Commander. It does not add uploads, asynchronous
conversion tasks, remote URLs, progress, retries, or file management.

Data is stored in `.data/file-exchange.sqlite`. Run `pnpm check` to verify this example.
