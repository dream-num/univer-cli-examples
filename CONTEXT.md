# Univer CLI Examples

This repository contains runnable teaching examples for composing Univer CLI SDK capabilities into focused content workflows.

## Language

**Resource-backed Slide**:
A Slide page whose SVG authoring source references at least one visual asset exported from Resource Library by stable handle before the compiler produces the Univer page.
_Avoid_: SVG Slide, asset-enabled Slide

**Resource-backed Slide deck**:
A Slide Unit rebuilt from an Authoring Source in which at least one page references a visual asset exported from Resource Library by stable handle.
_Avoid_: Resource-backed page, generated deck

**Presentation Brief**:
The user's requested audience, purpose, narrative, content, and delivery constraints for a generated Slide deck.
_Avoid_: prompt, template

**Authoring Source**:
The maintained inputs from which a Slide deck can be rebuilt: its Presentation Brief or deck specification, page SVGs, exported visual assets, and optional Native Enhancements; compiled Facade programs are disposable build outputs.
_Avoid_: generated program, Slide template

**Native Enhancement**:
Maintained authoring code that adds editable Slide semantics the SVG compiler does not express, such as a native chart or table.
_Avoid_: generated program, terminal patch

**Baseline Deck**:
The committed multi-page Authoring Source that gives an application a deterministic teaching and acceptance target.
_Avoid_: template, generated sample

**Review Evidence**:
Per-page structured inspection, layout findings, rendered screenshots, and a deck-level consistency assessment used together before handoff.
_Avoid_: screenshot, inspection result

**Review URL**:
A Server-scoped URL for viewing a trunk or Worktree Slide deck while the example's Web Server is running.
_Avoid_: public URL, permanent share link

**Typst Source Bundle**:
The author-owned manifest, ordered Typst page sources, optional prelude, and local assets used to create one Univer Doc.
_Avoid_: generated program, output directory

**Materialized Doc**:
A Univer Doc created by executing the Facade program compiled from a Typst Source Bundle.
_Avoid_: Typst document, preview

**Local Doc Identity**:
The `targetUnitId` shared by a Typst Source Bundle and its Materialized Doc inside one example build; it is not an external Workspace identity.
_Avoid_: Workspace ID, remote Unit ID

**Generated Artifact**:
A replaceable output derived from a Typst Source Bundle, such as a Facade program, diagnostics, Doc UnitData, or PNG.
_Avoid_: source, authored document

**Typst Preview**:
A PNG rendered directly from a Typst Source Bundle as evidence of the source-side layout.
_Avoid_: Univer Screenshot, final preview

**Univer Screenshot**:
A PNG rendered from a Materialized Doc as evidence of the resulting Univer layout.
_Avoid_: Typst Preview, source preview

**Machine Result**:
The single JSON document written to stdout when an example command succeeds in `--json` mode.
_Avoid_: JSON log, success message

**Machine Failure**:
The single JSON document written to stderr when an example command fails in `--json` mode.
_Avoid_: stdout error, human-readable stack trace
