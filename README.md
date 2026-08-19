# Univer CLI SDK Examples

English | [简体中文](./README.zh-CN.md)

This repository provides the public user manual and runnable examples for the Univer CLI SDK.

## Repository layout

- [`user-manual`](./user-manual/README.md) is the complete CLI SDK integration guide.
- [`examples`](./examples/README.md) contains independent applications built only with published public APIs.

## Requirements

- Node.js 22.12 or later
- pnpm 10
- Access to the Univer Insiders registry while the packages remain on the Insiders release channel

Every example will pin a mutually compatible release cohort and document its own runtime, license,
and external-service requirements.

## Quick start

Install dependencies and run the API reference example:

```bash
pnpm install
pnpm example:quick-start api find --unit sheet setValues
pnpm example:quick-start api show FRange.setValues
pnpm example:univer-mini --help
```

`quick-start-cli` has no practical product purpose. It uses API reference lookup only to demonstrate
the smallest complete capability + Commander preset + application composition. It does not launch
Univer, require a license, or access online documentation.
