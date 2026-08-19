# Quick Start

English | [简体中文](./quick-start.zh-CN.md)

This quick start builds a complete Commander application that searches the Univer Facade API
reference offline.

## Run it

Prepare Node.js 22.12 or later and pnpm 10, then run from the repository root:

```bash
pnpm install
pnpm example:api-reference -- api find --unit sheet setValues
```

The command should list `FRange.setValues` among its matches. Inspect that symbol precisely:

```bash
pnpm example:api-reference -- api show FRange.setValues
```

## What is assembled

The application creates its own root Commander `Command`, creates the structured API reference
capability, and adds the optional command preset with `addCommand()`:

```ts
const program = new Command("univer-api");
program.addCommand(
  createApiCommand({
    reference: createStandardApiReference(),
  }),
);
```

`@univer-cli/api-reference` owns search and symbol lookup. The optional
`@univer-cli/api-reference-command` package owns the default `api find` and `api show` terminal
interaction. The application still owns its root command and top-level failure behavior.

See the [complete example](../examples/api-reference-cli/README.md) for its source layout and test.
