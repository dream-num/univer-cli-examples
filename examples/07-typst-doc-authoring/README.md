# Typst Doc authoring

[简体中文](./README.zh-CN.md)

This example turns a tracked Typst Source Bundle into an editable local Univer Doc. One command compiles the source, materializes the generated Facade program in headless Univer, saves Doc UnitData, and renders both source-side and Univer-side PNG evidence.

## Run it

Requires Node.js 22.12 or later and pnpm 10.32.1.

```bash
pnpm install --frozen-lockfile
pnpm build
node dist/cli/main.js compile-typst paper --out output --json
```

Edit only these authored files before rebuilding:

- `paper/typst.json`: title, Local Doc Identity (`targetUnitId`), prelude, and ordered pages.
- `paper/prelude.typ`: page geometry, typography, spacing, colors, header, and footer.
- `paper/pages/brief.typ`: the brief's content and layout.

`targetUnitId` connects this bundle to its Materialized Doc inside the local build. It is not a Workspace identity or remote Unit ID.

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

The bundled `univer-content` skill encodes this workflow. Install or remove its local symlink with:

```bash
pnpm skill:install
pnpm skill:uninstall
```

## Runtime boundaries

- Typst compilation supports the native binding targets published for macOS x64/arm64, Linux glibc x64/arm64, and Windows x64. Linux musl and Windows arm64 are outside this example's supported matrix.
- Univer Screenshots require Chrome, Chromium, or Edge. Set `UNIVER_RENDER_BROWSER` when automatic discovery cannot find the executable.
- `UNIVER_LICENSE` is optional for compile/materialize/save. Screenshot output follows the Pro render plugin's license and watermark behavior; an empty license may produce a watermark.
- The command uses only the package's native Typst binding and only executes the program returned by the current compile. It does not use a system Typst executable or accept an existing JavaScript program.
