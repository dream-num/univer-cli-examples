# Univer CLI SDK

English | [简体中文](./README.zh-CN.md)

A TypeScript infrastructure SDK for quickly building Univer-aware CLI applications around your own business workflows.

[Quick Start](#quick-start) · [Package Guide](#package-guide) · [SDK Boundaries](#sdk-boundaries) · [Application Examples](#application-examples)

The Univer CLI SDK packages Univer's headless content execution, collaboration, structured content
inspection, Office conversion, screenshots, and local process management as independently installable
capabilities. Common capabilities also provide ready-made Commander command presets.

Developers can compose only the packages they need and focus on business rules, product interaction,
and external-system integration.

This is an SDK, not a fixed product CLI or a custom CLI framework. Applications continue to use
native Commander `addCommand()` calls and retain full control over command names, arguments, output,
and error handling.

## What it helps you build

- **Business CLIs quickly**: reuse common Univer CLI capabilities and runtime infrastructure.
- **Only the capabilities you need**: command presets never create or take over the root program.
- **Your preferred interaction**: use a ready-made Commander command or call structured TypeScript APIs directly.
- **Application-owned integrations**: the application decides how to connect to external systems.
- **Stable runtimes**: reuse maintained headless, collaboration, rendering, and process infrastructure.

## Quick start

Node.js 22.12 or later is required.

> **Release status:** Packages are currently published through the Univer Insiders registry. Configure
> the registry for the `@univer-cli` scope before installation and select the version for your release channel.

```ini
@univer-cli:registry=https://insider-npm-registry.univer.work/
```

For example, add offline Univer Facade API lookup to a business CLI. When only the capability is
needed, install and call the base package directly:

```bash
pnpm add @univer-cli/api-reference
```

```ts
import { createStandardApiReference } from "@univer-cli/api-reference";

const reference = createStandardApiReference();
const matches = reference.find({
  terms: ["conditional formatting"],
  unit: "sheet",
  limit: 10,
});
```

When the default terminal interaction is useful, also install the matching command preset and add
it to the existing Commander application:

```bash
pnpm add commander @univer-cli/api-reference @univer-cli/api-reference-command
```

```ts
import { createStandardApiReference } from "@univer-cli/api-reference";
import { createApiCommand } from "@univer-cli/api-reference-command";
import { Command } from "commander";

const program = new Command("my-cli");

program.addCommand(
  createApiCommand({
    reference: createStandardApiReference(),
  }),
);

await program.parseAsync();
```

After building the application:

```bash
my-cli api find --unit sheet conditional formatting
my-cli api show FRange.setValues
```

If the default interaction does not suit the product, omit
`@univer-cli/api-reference-command`, call the structured `@univer-cli/api-reference` API directly,
and design application-specific commands, arguments, and output. Other capabilities follow the same pattern.

## Two integration styles

```text
Business CLI application
├── call a capability directly ─────────> structured result ──> custom interaction
└── addCommand(command preset) ──> native Command ──> capability
```

Capability packages contain the complete behavior, rules, and input validation. They accept
structured input, return structured results, and do not depend on Commander or the terminal.
Packages ending in `-command` own arguments, options, help, default presentation, and exit behavior,
and return native Commander `Command` objects. The application injects dependencies and selects
commands at its composition root:

```ts
program.addCommand(createSomeCommand(dependencies));
```

Callers can continue using Commander's `configureOutput()`, `exitOverride()`, hooks, aliases, and
custom help.

## Package guide

### Univer content and collaboration runtimes

| Need | Capability package | Optional command preset |
| --- | --- | --- |
| Create a standard headless Univer | [`@univer-cli/headless-univer`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/headless-univer) | — |
| Search the Univer Facade API offline | [`@univer-cli/api-reference`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/api-reference) | [`@univer-cli/api-reference-command`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/api-reference-command) |
| Prepare and bind Facade execution | [`@univer-cli/content-execution`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/content-execution) | — |
| Inspect Sheet, Doc, or Slide content | [`@univer-cli/content-inspection`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/content-inspection) | [`@univer-cli/content-inspection-command`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/content-inspection-command) |
| Run one collaborative Unit | [`@univer-cli/univer-collaboration-runtime`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/univer-collaboration-runtime) | — |
| Reuse collaboration runtimes in workers | [`@univer-cli/univer-collaboration-runtime-pool`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/univer-collaboration-runtime-pool) | — |

### Conversion

| Need | Capability package | Optional command preset |
| --- | --- | --- |
| Convert Office files and UnitData | [`@univerjs-pro/exchange-node`](https://www.npmjs.com/package/@univerjs-pro/exchange-node) | — |
| Compile SVG to Slide Facade code | [`@univer-cli/svg-facade`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/svg-facade) | [`@univer-cli/svg-facade-command`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/svg-facade-command) |
| Compile Typst bundles to Doc Facade code | [`@univer-cli/doc-typst-facade`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/doc-typst-facade) | [`@univer-cli/doc-typst-facade-command`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/doc-typst-facade-command) |

### Rendering and diagnostics

| Need | Capability package | Optional command preset |
| --- | --- | --- |
| Capture Unit PNG screenshots | [`@univer-cli/unit-screenshot`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/unit-screenshot) | [`@univer-cli/unit-screenshot-command`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/unit-screenshot-command) |
| Lint Slide layout | [`@univer-cli/unit-layout-lint`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/unit-layout-lint) | [`@univer-cli/unit-layout-lint-command`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/unit-layout-lint-command) |
| Host a Render Page and drive a browser | [`@univer-cli/univer-render-runtime`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/univer-render-runtime) | — |
| Assemble and build a Render Page | [`@univer-cli/univer-render-page`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/univer-render-page) | — |

### Process and lifecycle infrastructure

| Need | Capability package | Optional command preset |
| --- | --- | --- |
| Exclusively lease, cache, and evict keyed stateful objects | [`@univer-cli/generic-keyed-instance-pool`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/generic-keyed-instance-pool) | — |
| Share a local resident process across CLI invocations | [`@univer-cli/daemon`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/daemon) | [`@univer-cli/daemon-command`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/daemon-command) |

### Application support

| Need | Capability package | Optional command preset |
| --- | --- | --- |
| Declare, read, and persist application configuration | [`@univer-cli/config`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/config) | [`@univer-cli/config-command`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/config-command) |
| Query, cache, and export visual resources | [`@univer-cli/resource-library`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/resource-library) | [`@univer-cli/resource-library-command`](https://github.com/dream-num/univer-cli-sdk/tree/main/packages/resource-library-command) |

Choose the capability package that matches the application need first. Add the preset in the same
row only when its default CLI interaction is useful. Each package README documents installation,
public APIs, a minimal example, behavior limits, and runtime dependencies.

## SDK boundaries

A complete business CLI is usually assembled from three SDKs and the application:

| Layer | Responsibility |
| --- | --- |
| Univer / Univer Pro SDK | Unit data models, Facade APIs, mutations, rendering, and content formats |
| Univer Collaboration SDK | Snapshots, changesets, revisions, OT, Worktrees, collaboration services, and persistence SPI |
| Univer CLI SDK | Standard headless factory, reusable CLI capabilities, runtime pools, daemon, and Commander presets |
| Business CLI application | Business rules, product interaction, and external integrations |

The Univer CLI SDK consumes the other SDKs only through their public APIs. It does not duplicate
their content models, collaboration protocols, or storage implementations. The SDK owns reusable
CLI infrastructure; the application owns business behavior and external integration.

## Application examples

- [`quick-start-cli`](../examples/quick-start-cli/README.md): minimal Commander preset composition with no practical product purpose.
- [`univer-mini-cli`](../examples/univer-mini-cli/README.md): a complete local Office workflow covering creation, import, inspection, editing, and export.
- [`univer-cli`](https://github.com/dream-num/univer-cli): a complete CLI for local `.univer` files.
- [`univer-workspace/apps/cli`](https://github.com/dream-num/univer-workspace/tree/main/apps/cli): a complete CLI for remote Workspace targets.

Choose the local or remote application closest to your integration scenario and use its composition
as the next reference.
