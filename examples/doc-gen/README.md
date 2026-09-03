# Doc Gen

English | [简体中文](./README.zh-CN.md)

This agent-oriented example creates editable local Univer Docs from Typst. For each request, the
agent creates or revises a task-specific Typst Source Bundle, compiles it, materializes the generated
Facade program in headless Univer, saves Doc UnitData, and reviews source-side and Univer-side PNGs.

## Set up the example

Requires Node.js 22.12 or later and pnpm 10.32.1.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm link-cli
pnpm skill:install
```

Open this directory with an Agent and ask it to use `doc-gen`, for example:

```text
Use doc-gen to create a two-page customer research brief. Keep the source under
authoring/customer-research and generated artifacts under output/customer-research.
```

The Agent creates the source instead of editing a bundled document. If you already have a bundle,
give its directory or `typst.json` path in the request.

## Typst Source Bundle

The path is caller-selected. A typical bundle looks like:

```text
authoring/customer-research/
├── typst.json
├── prelude.typ
├── pages/
│   ├── 01.typ
│   └── 02.typ
└── assets/
    └── diagram.svg
```

`typst.json` declares the Local Doc Identity and ordered page sources:

```json
{
  "schemaVersion": 1,
  "targetUnitId": "customer-research",
  "title": "Customer research brief",
  "prelude": ["prelude.typ"],
  "pages": [
    { "id": "page-01", "source": "pages/01.typ" },
    { "id": "page-02", "source": "pages/02.typ" }
  ]
}
```

`schemaVersion`, `targetUnitId`, and `pages` are required. `title`, `prelude`, explicit page IDs,
and local `assets/` are optional. All referenced paths must stay inside the bundle. The authored
bundle remains source; generated JavaScript, JSON, and PNG files do not.

`targetUnitId` connects this bundle to its Materialized Doc inside the local build. It is not a Workspace identity or remote Unit ID.

Build any bundle directory or manifest path with a separate output directory:

```bash
doc-gen compile-typst <bundle-or-manifest> --out <output-directory> --json
```

## Generated Artifacts

The required `--out` directory receives:

| Path               | Meaning                                          |
| ------------------ | ------------------------------------------------ |
| `document.js`      | Facade program generated from the current bundle |
| `diagnostics.json` | Structured compiler diagnostics                  |
| `document.json`    | Saved Materialized Doc UnitData                  |
| `typst/*.png`      | Typst Previews for source-side layout review     |
| `univer/*.png`     | Univer Screenshots for the converted Doc         |

The command replaces only these known artifacts. Other files in the output directory remain untouched, and the example ignores `/output/` in Git.

In `--json` mode, success writes one Machine Result to stdout. Failure writes one Machine Failure to stderr. Error diagnostics stop before materialization; warnings allow success and remain in the result for review.

## Visual review

Read both PNG groups after every successful build:

1. Check Typst Previews for requested text, hierarchy, margins, wrapping, and table geometry.
2. Check Univer Screenshots for the same content, clipping, missing blocks, and conversion differences.
3. Report remaining warnings. Visual verification stays pending if either image group cannot be read by an image-capable model.

The bundled `doc-gen` skill encodes bundle creation, compilation, and review. Install or remove its
local symlink with:

```bash
pnpm skill:install
pnpm skill:uninstall
```

## Runtime boundaries

- Typst compilation supports the native binding targets published for macOS x64/arm64, Linux glibc x64/arm64, and Windows x64. Linux musl and Windows arm64 are outside this example's supported matrix.
- Univer Screenshots require Chrome, Chromium, or Edge. Set `UNIVER_RENDER_BROWSER` when automatic discovery cannot find the executable.
- `UNIVER_LICENSE` is optional for compile/materialize/save. Screenshot output follows the Pro render plugin's license and watermark behavior; an empty license may produce a watermark.
- The command uses only the package's native Typst binding and only executes the program returned by the current compile. It does not use a system Typst executable or accept an existing JavaScript program.
