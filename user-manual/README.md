# Univer CLI SDK User Manual

English | [简体中文](./README.zh-CN.md)

The Univer CLI SDK provides target-neutral capabilities, optional Commander command presets, and
runtime infrastructure for building Univer-aware CLI applications.

Start by choosing the capability package for the application task. Add its matching `-command`
package only when the default Commander interaction is useful. The application remains responsible
for its root `Command`, explicit `addCommand()` composition, product targets, storage, credentials,
and external integrations.

Detailed integration chapters will be added together with runnable examples and a published,
verified release cohort.
