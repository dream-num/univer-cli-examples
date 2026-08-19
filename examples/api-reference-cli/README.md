# API Reference CLI

English | [简体中文](./README.zh-CN.md)

This example composes a complete CLI that searches and inspects the Univer Facade API offline.
It demonstrates the repository's smallest useful integration pattern:

```text
application root Command
└── addCommand(api preset)
                  └── structured API reference capability
```

## Run

From the repository root:

```bash
pnpm install
pnpm example:api-reference -- api find --unit sheet setValues
pnpm example:api-reference -- api show FRange.setValues
```

The example needs no Univer runtime, license, browser, daemon, or external service.

## Source layout

- [`src/program.ts`](./src/program.ts) is the composition root. It creates the capability and adds
  the preset to the application's native Commander program.
- [`src/index.ts`](./src/index.ts) is the process boundary and maps failures to an exit code.
- [`test/smoke.test.ts`](./test/smoke.test.ts) invokes the built entrypoint and verifies real output.

## Customize it

`createApiCommand()` returns a native Commander `Command`. An application can rename it, add an
alias, configure output, or replace the preset entirely and call `reference.find()` and
`reference.show()` to produce structured application-specific output.
