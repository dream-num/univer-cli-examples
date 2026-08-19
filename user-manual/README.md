# Univer CLI SDK User Manual

English | [简体中文](./README.zh-CN.md)

The Univer CLI SDK provides target-neutral capabilities, optional Commander command presets, and
runtime infrastructure for building Univer-aware CLI applications.

Start by choosing the capability package for the application task. Add its matching `-command`
package only when the default Commander interaction is useful. The application remains responsible
for its root `Command`, explicit `addCommand()` composition, product targets, storage, credentials,
and external integrations.

## Start here

1. Follow the [Quick Start](./quick-start.md) to build and run the first CLI.
2. Read the matching [example source](../examples/api-reference-cli/README.md).
3. Add another capability only when the application has a concrete need for it.

The repository currently pins release cohort `1.0.0-insiders.20260819-8595af2`.
