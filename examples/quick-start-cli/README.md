# Quick Start CLI

English | [简体中文](./README.zh-CN.md)

This example has no practical product purpose. Its only goal is to show the smallest complete
Univer CLI SDK application composition:

```text
application root Command
└── addCommand(api preset)
                  └── structured API reference capability
```

API reference lookup is used because it needs no Univer runtime, license, browser, daemon, or
external service. The lookup itself is not the point of this example.

## Run

From the repository root:

```bash
pnpm install
pnpm example:quick-start -- api find --unit sheet setValues
pnpm example:quick-start -- api show FRange.setValues
```

## What to read

- [`src/program.ts`](./src/program.ts) is the composition root. It creates one capability and adds
  its preset to a native Commander program.
- [`src/index.ts`](./src/index.ts) is the process boundary and maps failures to exit codes.
- [`test/smoke.test.ts`](./test/smoke.test.ts) invokes the built entrypoint to prove the minimal
  assembly is runnable.

For an example with an actual end-to-end workflow, use
[`univer-mini-cli`](../univer-mini-cli/README.md).
