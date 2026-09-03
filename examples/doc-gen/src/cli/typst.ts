import {
  compileDocTypstBundle,
  type CompileDocTypstBundleResult,
  type DocTypstDiagnostic,
} from "@univer-cli/doc-typst-facade";
import {
  createStandardHeadlessUniverFacade,
  createStandardHeadlessUniverFactory,
} from "@univer-cli/headless-univer";
import { createUnitScreenshot } from "@univer-cli/unit-screenshot";
import { createUniverRenderRuntime } from "@univer-cli/univer-render-runtime";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { UniverInstanceType, type IDocumentData } from "@univerjs/core";

export type FailureCode =
  | "ARGUMENT_ERROR"
  | "COMPILE_ERROR"
  | "IO_ERROR"
  | "MATERIALIZE_ERROR"
  | "RENDER_ERROR";

interface ArtifactPaths {
  readonly program?: string;
  readonly diagnostics?: string;
  readonly document?: string;
  readonly typstPreviews?: readonly string[];
  readonly univerScreenshots?: readonly string[];
}

export interface MachineResult {
  readonly ok: true;
  readonly title: string;
  readonly targetUnitId: string;
  readonly diagnostics: readonly DocTypstDiagnostic[];
  readonly artifacts: Required<ArtifactPaths>;
  readonly visualReviewRequired: true;
}

export interface MachineFailure {
  readonly ok: false;
  readonly code: FailureCode;
  readonly message: string;
  readonly diagnostics: readonly DocTypstDiagnostic[];
  readonly artifacts: ArtifactPaths;
}

export async function buildTypstDocument(
  bundle: string,
  destination: string,
): Promise<MachineResult | MachineFailure> {
  const outputDirectory = resolve(destination);
  let code: FailureCode = "IO_ERROR";
  let diagnostics: readonly DocTypstDiagnostic[] = [];

  try {
    await mkdir(outputDirectory, { recursive: true });
    await cleanKnownArtifacts(outputDirectory);

    code = "COMPILE_ERROR";
    const compiled = await compileDocTypstBundle(resolve(bundle), {
      previewDir: join(outputDirectory, "typst"),
    });
    diagnostics = compiled.diagnostics;
    await writeJson(join(outputDirectory, "diagnostics.json"), {
      schemaVersion: 1,
      diagnostics,
    });
    const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
    if (errors.length > 0) {
      throw new Error(`Typst compile returned ${String(errors.length)} error diagnostics`);
    }

    code = "IO_ERROR";
    await writeFile(join(outputDirectory, "document.js"), compiled.javascript, "utf8");

    code = "MATERIALIZE_ERROR";
    const document = await materialize(compiled);
    await writeJson(join(outputDirectory, "document.json"), document);

    code = "RENDER_ERROR";
    await renderDocument(document, join(outputDirectory, "univer"));

    const artifacts = await collectArtifacts(outputDirectory);
    if (
      artifacts.program === undefined ||
      artifacts.diagnostics === undefined ||
      artifacts.document === undefined ||
      artifacts.typstPreviews === undefined ||
      artifacts.typstPreviews.length === 0 ||
      artifacts.univerScreenshots === undefined ||
      artifacts.univerScreenshots.length === 0
    ) {
      throw new Error("Build completed without every required artifact");
    }
    return {
      ok: true,
      title: compiled.title,
      targetUnitId: compiled.targetUnitId,
      diagnostics,
      artifacts: artifacts as Required<ArtifactPaths>,
      visualReviewRequired: true,
    };
  } catch (error) {
    const thrownDiagnostics = diagnosticsFrom(error);
    if (thrownDiagnostics !== undefined) diagnostics = thrownDiagnostics;
    if (code === "COMPILE_ERROR" && diagnostics.length > 0) {
      try {
        await writeJson(join(outputDirectory, "diagnostics.json"), {
          schemaVersion: 1,
          diagnostics,
        });
      } catch {
        code = "IO_ERROR";
      }
    }
    return {
      ok: false,
      code,
      message: error instanceof Error ? error.message : String(error),
      diagnostics,
      artifacts: await collectArtifactsSafely(outputDirectory),
    };
  }
}

async function materialize(compiled: CompileDocTypstBundleResult): Promise<IDocumentData> {
  const createUniver = createStandardHeadlessUniverFactory({
    license: process.env["UNIVER_LICENSE"] ?? "",
  });
  const univer = await createUniver({
    unitId: compiled.targetUnitId,
    unitType: UniverInstanceType.UNIVER_DOC,
  });
  try {
    const univerAPI = createStandardHeadlessUniverFacade(univer);
    // The local compiler emits the trusted async body executed by this command.
    // oxlint-disable-next-line no-new-func -- no existing JavaScript file is accepted as input.
    const execute = new Function(
      "univerAPI",
      `"use strict"; return (async () => { ${compiled.javascript}\n})();`,
    ) as (api: typeof univerAPI) => Promise<unknown>;
    await execute(univerAPI);
    const document = univerAPI.getDocument(compiled.targetUnitId);
    if (document === null) {
      throw new Error(`Generated program did not create Doc ${compiled.targetUnitId}`);
    }
    return document.save();
  } finally {
    univer.dispose();
  }
}

async function renderDocument(document: IDocumentData, directory: string): Promise<void> {
  const runtime = await createUniverRenderRuntime({
    renderPageRoot: fileURLToPath(new URL("../render-page", import.meta.url)),
    license: process.env["UNIVER_LICENSE"] ?? "",
  });
  try {
    const result = await createUnitScreenshot({ runtime }).capture({
      unitType: "doc",
      unitData: document,
      target: { kind: "doc-pages" },
    });
    await mkdir(directory, { recursive: true });
    for (const image of result.images) {
      if (basename(image.name) !== image.name || !image.name.endsWith(".png")) {
        throw new Error(`Screenshot returned unsafe image name: ${image.name}`);
      }
      await writeFile(join(directory, image.name), image.bytes);
    }
  } finally {
    await runtime.close();
  }
}

async function cleanKnownArtifacts(outputDirectory: string): Promise<void> {
  await Promise.all(
    ["document.js", "diagnostics.json", "document.json"].map((name) =>
      rm(join(outputDirectory, name), { force: true }),
    ),
  );
  await Promise.all(
    ["typst", "univer"].map(async (name) => {
      const directory = join(outputDirectory, name);
      for (const entry of await readDirectory(directory)) {
        if (entry.isFile() && entry.name.endsWith(".png")) {
          await rm(join(directory, entry.name));
        }
      }
    }),
  );
}

async function collectArtifacts(outputDirectory: string): Promise<ArtifactPaths> {
  const program = join(outputDirectory, "document.js");
  const diagnostics = join(outputDirectory, "diagnostics.json");
  const document = join(outputDirectory, "document.json");
  const typstPreviews = await pngFiles(join(outputDirectory, "typst"));
  const univerScreenshots = await pngFiles(join(outputDirectory, "univer"));
  return {
    ...((await isFile(program)) ? { program } : {}),
    ...((await isFile(diagnostics)) ? { diagnostics } : {}),
    ...((await isFile(document)) ? { document } : {}),
    ...(typstPreviews.length > 0 ? { typstPreviews } : {}),
    ...(univerScreenshots.length > 0 ? { univerScreenshots } : {}),
  };
}

async function collectArtifactsSafely(outputDirectory: string): Promise<ArtifactPaths> {
  try {
    return await collectArtifacts(outputDirectory);
  } catch {
    return {};
  }
}

async function pngFiles(directory: string): Promise<readonly string[]> {
  return (await readDirectory(directory))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
    .map((entry) => join(directory, entry.name))
    .sort();
}

async function readDirectory(directory: string) {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return [];
    throw error;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return false;
    throw error;
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function diagnosticsFrom(error: unknown): readonly DocTypstDiagnostic[] | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const diagnostics = Reflect.get(error, "diagnostics");
  return Array.isArray(diagnostics) ? (diagnostics as readonly DocTypstDiagnostic[]) : undefined;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}
