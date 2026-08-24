import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createUnitLayoutLint, type UnitLayoutLint } from "@univer-cli/unit-layout-lint";
import { createUnitLayoutLintCommand } from "@univer-cli/unit-layout-lint-command";
import { createUnitScreenshot, type UnitScreenshot } from "@univer-cli/unit-screenshot";
import {
  createUnitScreenshotCommand,
  type UnitScreenshotWriteInput,
  type UnitScreenshotWrittenImage,
} from "@univer-cli/unit-screenshot-command";
import {
  createUniverRenderRuntime,
  type UniverRenderUnit,
} from "@univer-cli/univer-render-runtime";
import type { ISlideData } from "@univerjs-pro/slides";
import type { IDocumentData, IWorkbookData } from "@univerjs/core";
import { Option, type Command } from "commander";
import { fromInstanceType } from "../../shared/unit.js";
import { DEFAULT_SERVER_URL } from "../../shared/urls.js";
import { loadRuntime } from "./unit-content.js";

export function screenshotCommand(): Command {
  let command: Command;
  command = createUnitScreenshotCommand({
    screenshot: lazyScreenshot(),
    loadUnit: async ({ unitId }) => {
      if (unitId === undefined) throw new Error("Specify --unit");
      return await loadRenderUnit(unitId, selectedWorktree(command));
    },
    writeImages,
  });
  return addReadTarget(command);
}

export function lintCommand(): Command {
  let command: Command;
  command = createUnitLayoutLintCommand({
    lint: lazyLayoutLint(),
    loadUnit: async ({ unitId }) => {
      const unit = await loadRenderUnit(unitId, selectedWorktree(command));
      if (unit.unitType !== "slide") throw new Error("Layout lint requires a Slide Unit");
      return unit;
    },
  });
  return addReadTarget(command);
}

async function loadRenderUnit(unitId: string, worktreeID?: string): Promise<UniverRenderUnit> {
  const contentRuntime = await loadRuntime(DEFAULT_SERVER_URL, unitId, worktreeID);
  try {
    const unitData = (await contentRuntime.exportUnitData()) as
      | IWorkbookData
      | IDocumentData
      | ISlideData;
    return renderUnit(fromInstanceType(contentRuntime.unitType), unitData);
  } finally {
    await contentRuntime.close();
  }
}

function addReadTarget(command: Command): Command {
  return command
    .addOption(new Option("--trunk", "read from trunk").conflicts("worktree"))
    .addOption(new Option("--worktree <id>", "read from a Worktree").conflicts("trunk"));
}

function selectedWorktree(command: Command): string | undefined {
  const options = command.opts<{ readonly trunk?: boolean; readonly worktree?: string }>();
  if (options.trunk !== true && options.worktree === undefined) {
    throw new Error("Specify --trunk or --worktree <id>");
  }
  return options.worktree;
}

function renderUnit(
  unitType: "sheet" | "doc" | "slide",
  unitData: IWorkbookData | IDocumentData | ISlideData,
): UniverRenderUnit {
  switch (unitType) {
    case "sheet":
      return { unitType, unitData: unitData as IWorkbookData };
    case "doc":
      return { unitType, unitData: unitData as IDocumentData };
    case "slide":
      return { unitType, unitData: unitData as ISlideData };
  }
}

function lazyScreenshot(): UnitScreenshot {
  return {
    async capture(input) {
      const runtime = await createUniverRenderRuntime({
        renderPageRoot: fileURLToPath(new URL("../../render-page", import.meta.url)),
        license: process.env["UNIVER_LICENSE"] ?? "",
      });
      try {
        return await createUnitScreenshot({ runtime }).capture(input);
      } finally {
        await runtime.close();
      }
    },
  };
}

function lazyLayoutLint(): UnitLayoutLint {
  return {
    async lint(input) {
      const runtime = await createUniverRenderRuntime({
        renderPageRoot: fileURLToPath(new URL("../../render-page", import.meta.url)),
        license: process.env["UNIVER_LICENSE"] ?? "",
      });
      try {
        return await createUnitLayoutLint({ runtime }).lint(input);
      } finally {
        await runtime.close();
      }
    },
  };
}

async function writeImages(
  input: UnitScreenshotWriteInput,
): Promise<readonly UnitScreenshotWrittenImage[]> {
  const directory = resolve(input.destination ?? "output");
  await mkdir(directory, { recursive: true });
  return await Promise.all(
    input.result.images.map(async (image) => {
      const location = resolve(directory, image.name);
      await writeFile(location, image.bytes);
      return { name: image.name, location };
    }),
  );
}
