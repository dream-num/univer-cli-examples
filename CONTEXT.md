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
