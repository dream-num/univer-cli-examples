# Univer CLI Examples

English | [简体中文](./README.zh-CN.md)

This repository contains runnable teaching examples for the Univer CLI SDK. Concepts and
architecture live on the [Univer Office documentation site](https://office.univer.ai/cli/overview).

| Example                                                               | Learn                                            | New concepts                            |
| --------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------- |
| [`01-content-operations`](./examples/01-content-operations/README.md) | Read, edit, and view Sheet, Doc, and Slide Units | CLI, Server, Web, Collaboration Runtime |
| [`02-visual-inspection`](./examples/02-visual-inspection/README.md)   | Capture the three Unit types from 01             | Render Page, Render Runtime             |

Read them in numbered order. Each directory has its own `package.json`, lockfile, and dependencies,
so it can be copied and run independently.

## 01 Content Operations

```bash
cd examples/01-content-operations
corepack enable
pnpm install
pnpm build
pnpm server
```

After the Server starts, install the skill from another terminal in the same directory:

```bash
pnpm skill:install
```

Open the `01-content-operations` directory with an Agent and enter:

```text
Use univer-content to create a sales spreadsheet with 10 sample records.
```

## 02 Visual Inspection

```bash
cd examples/02-visual-inspection
corepack enable
pnpm install
pnpm build
pnpm server
```

Use another terminal in the same `02-visual-inspection` directory:

```bash
pnpm start create sheet --name "Visual Demo"
pnpm start screenshot --unit <unit-id> --sheet Data --range A1:B2 --out output
```

See each example README for its complete command sequence and verification steps.

These examples are minimal teaching assemblies, not production applications. Login,
authorization, Worktree, Daemon, and file exchange belong in later examples that need them.
