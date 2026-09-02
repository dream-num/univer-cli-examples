# Univer CLI Examples

English | [简体中文](./README.zh-CN.md)

This repository contains runnable teaching examples for the Univer CLI SDK. Concepts and
architecture live on the [Univer Office documentation site](https://office.univer.ai/cli/overview).

| Example                                                               | Learn                                             | New concepts                            |
| --------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------- |
| [`01-content-operations`](./examples/01-content-operations/README.md) | Read, edit, and view Sheet, Doc, and Slide Units  | CLI, Server, Web, Collaboration Runtime |
| [`02-file-exchange`](./examples/02-file-exchange/README.md)           | Import and export Office files                    | Exchange, UnitData, native binding      |
| [`03-visual-inspection`](./examples/03-visual-inspection/README.md)   | Visually inspect all three Unit types             | Render Page, Screenshot, Layout Lint    |
| [`04-worktree`](./examples/04-worktree/README.md)                     | Edit in a draft and hand it to a human for review | Worktree, Ready, Merge, Reopen, Discard |

Read them in numbered order. Each directory has its own `package.json`, lockfile, and dependencies,
so it can be copied and run independently.

## Agent application

[`slide-gen-cli`](./examples/slide-gen-cli/README.md) generates, reviews, exports, and displays a
resource-backed Slide with an Agent.

## 01 Content Operations

```bash
cd examples/01-content-operations
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

After the Server starts, install the skill from another terminal in the same directory:

```bash
pnpm skill:install
```

Open the `01-content-operations` directory with an Agent and enter:

```text
Use univer-content to create a sales spreadsheet with 10 sample records.
```

## 02 File Exchange

```bash
cd examples/02-file-exchange
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

Use another terminal in the same `02-file-exchange` directory:

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Exchange Demo")
univer-example-cli export demo.xlsx --unit "$UNIT_ID"
IMPORTED_ID=$(univer-example-cli import demo.xlsx)
```

## 03 Visual Inspection

```bash
cd examples/03-visual-inspection
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

Use another terminal in the same `03-visual-inspection` directory:

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Visual Demo")
univer-example-cli screenshot --unit "$UNIT_ID" --sheet Data --range A1:B2 --out output
```

## 04 Worktree

```bash
cd examples/04-worktree
pnpm install
pnpm build
pnpm link-cli
pnpm start-server
```

Use another terminal in the same directory:

```bash
UNIT_ID=$(univer-example-cli create sheet --name "Worktree Demo")
WORKTREE_ID=$(univer-example-cli worktree create --unit "$UNIT_ID")
univer-example-cli open --unit "$UNIT_ID" --worktree "$WORKTREE_ID"
```

See each example README for its complete command sequence and verification steps. These are minimal
teaching assemblies, not production applications; they do not add production authorization, upload
tasks, Daemon, or similar product mechanisms.
