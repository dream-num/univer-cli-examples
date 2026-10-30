# Univer CLI Examples

English | [简体中文](./README.zh-CN.md)

This repository contains runnable teaching examples for the Univer CLI SDK. Concepts and
architecture live on the [Univer Office documentation site](https://office.univer.ai/cli/overview).

| Example                                                               | Learn                                                   | New concepts                               |
| --------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| [`01-content-operations`](./examples/01-content-operations/README.md) | Read, edit, and view Sheet, Doc, and Slide Units        | CLI, Server, Web, Collaboration Runtime    |
| [`02-file-exchange`](./examples/02-file-exchange/README.md)           | Import and export Office files                          | Exchange, UnitData, native binding         |
| [`03-visual-inspection`](./examples/03-visual-inspection/README.md)   | Visually inspect all three Unit types                   | Render Page, Screenshot, Layout Lint       |
| [`04-worktree`](./examples/04-worktree/README.md)                     | Edit in a draft and hand it to a human for review       | Worktree, Ready, Merge, Reopen, Discard    |
| [`slide-gen-cli`](./examples/slide-gen-cli/README.md)                 | Generate, review, export, and view Slides with an Agent | SVG Compile, Resource Library, Agent Skill |
| [`doc-gen`](./examples/doc-gen/README.md)                             | Author and visually verify a Doc with Typst             | Typst Compile, Doc Materialization         |

Read examples `01` through `04` in numbered order. Unnumbered examples are self-contained. Each
directory has its own `package.json`, lockfile, and dependencies, so it can be copied and run
independently.

## Repository layout

This repository is a pnpm **workspace**: shared toolchain and supply-chain configuration lives at
the root (`.npmrc`, `pnpm-workspace.yaml`), while every example keeps its own `package.json` and
`pnpm-lock.yaml` (`sharedWorkspaceLockfile: false`).

Two rules keep the examples distributable — do not revert them:

- **Never use the workspace protocol (`workspace:*`).** Examples must depend only on packages
  published to an npm registry, so any `examples/*` directory can be copied out of the repository
  and installed on its own. In monorepos it is the workspace protocol that breaks distribution,
  not the monorepo itself.
- **Keep one lockfile per example.** Each example pins an exact version combination that is
  verified and upgraded independently of the other examples.

### Private registry policy

`.npmrc` may temporarily point the `@univer-cli`, `@univerjs`, and `@univerjs-pro` scopes at the
insider registry to verify an SDK release before it is published. The CI merge gate fails while a
private registry is committed: **before merging into main, all npm packages must be promoted to
the public npm registry and the private registry config must be removed.** Lockfiles record only
integrity hashes, so they do not need to change when packages are promoted.

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
