import { UniverCollaborationPlugin } from "@univerjs-pro/collaboration";
import "@univerjs-pro/collaboration-client/facade";
import { UniverCollaborationClientPlugin } from "@univerjs-pro/collaboration-client";
import CollaborationClientEnUS from "@univerjs-pro/collaboration-client/locale/en-US";
import {
  BrowserCollaborationSocketService,
  UniverCollaborationClientUIPlugin,
} from "@univerjs-pro/collaboration-client-ui";
import "@univerjs-pro/collaboration-client-ui/lib/index.css";
import CollaborationClientUIEnUS from "@univerjs-pro/collaboration-client-ui/locale/en-US";
import {
  createWorktreeCollaborationConfig,
  WorktreeClient,
} from "@univerjs-pro/collaboration-worktree-client";
import type { WorktreeData } from "@univerjs-pro/collaboration-worktree-service";
import { UniverLicensePlugin } from "@univerjs-pro/license";
import { UniverSlidesPlugin } from "@univerjs-pro/slides";
import "@univerjs-pro/slides/facade";
import UniverSlidesEnUS from "@univerjs-pro/slides/locale/en-US";
import { UniverSlidesUIPlugin } from "@univerjs-pro/slides-ui";
import "@univerjs-pro/slides-ui/lib/index.css";
import UniverSlidesUIEnUS from "@univerjs-pro/slides-ui/locale/en-US";
import { IImageIoService, LocaleType, LogLevel } from "@univerjs/core";
import UniverDesignEnUS from "@univerjs/design/locale/en-US";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import "@univerjs/docs-ui/lib/index.css";
import UniverDocsUIEnUS from "@univerjs/docs-ui/locale/en-US";
import { UniverDrawingPlugin } from "@univerjs/drawing";
import "@univerjs/drawing-ui/lib/index.css";
import UniverDrawingUIEnUS from "@univerjs/drawing-ui/locale/en-US";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverNetworkPlugin } from "@univerjs/network";
import { UniverDocsCorePreset } from "@univerjs/preset-docs-core";
import "@univerjs/preset-docs-core/lib/index.css";
import UniverPresetDocsCoreEnUS from "@univerjs/preset-docs-core/locales/en-US";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import "@univerjs/preset-sheets-core/lib/index.css";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import { createUniver, defaultTheme, mergeLocales, type IPreset } from "@univerjs/presets";
import { UniverUIPlugin } from "@univerjs/ui";
import "@univerjs/ui/lib/index.css";
import UniverUIEnUS from "@univerjs/ui/locale/en-US";
import { parseUnitType, unitTypeLabel, type UnitSummary, type UnitType } from "../shared/unit.js";
import { createUnitUrl, viewerUrl } from "../shared/urls.js";
import "./styles.css";

const search = new URL(location.href).searchParams;
const unitId = search.get("unit");
const worktreeID = search.get("worktree");
const units = (await (await fetch(createUnitUrl(location.origin))).json()) as UnitSummary[];
renderUnits(units, unitId);
installCreateButton();

if (unitId !== null) {
  const unit = units.find((item) => item.unitId === unitId);
  if (unit === undefined) throw new Error(`Unknown Unit ${unitId}`);
  await mountEditor(unitId, parseUnitType(unit.unitType), worktreeID);
}

function renderUnits(units: readonly UnitSummary[], activeUnitId: string | null): void {
  const list = document.querySelector("#unit-list")!;
  for (const unit of units) {
    const button = document.createElement("button");
    button.className = `unit-link${unit.unitId === activeUnitId ? " active" : ""}`;
    button.type = "button";
    button.addEventListener("click", () =>
      location.assign(viewerUrl(location.origin, unit.unitId)),
    );

    const type = document.createElement("span");
    type.className = "unit-type";
    type.textContent = unitTypeLabel(unit.unitType);
    const name = document.createElement("span");
    name.className = "unit-name";
    name.textContent = unit.name;
    button.append(type, name);
    list.append(button);
  }
}

function installCreateButton(): void {
  document.querySelector("#create-form")!.addEventListener("submit", async (event) => {
    event.preventDefault();
    const type = parseUnitType(document.querySelector<HTMLSelectElement>("#create-type")!.value);
    const response = await fetch(createUnitUrl(location.origin), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const unit = (await response.json()) as UnitSummary;
    location.assign(viewerUrl(location.origin, unit.unitId));
  });
}

async function mountEditor(
  unitId: string,
  unitType: UnitType,
  worktreeID: string | null,
): Promise<void> {
  document.querySelector<HTMLElement>("#empty")!.style.display = "none";
  const app = document.querySelector<HTMLElement>("#app")!;
  app.style.display = "block";
  document.querySelector("#status")!.textContent = "Connecting…";

  const endpoint = `${location.origin}/universer-api`;
  let worktree: WorktreeData | undefined;
  if (worktreeID === null) {
    app.inert = true;
  } else {
    worktree = await new WorktreeClient({ origin: location.origin }).getWorktree(worktreeID);
    if (!worktree.units.some((unit) => unit.unitID === unitId)) {
      throw new Error(`Worktree ${worktreeID} does not contain Unit ${unitId}`);
    }
    app.inert = worktree.status !== "draft";
    renderReviewActions(worktree);
  }

  const collaborationConfig =
    worktreeID === null
      ? {
          snapshotServerUrl: `${endpoint}/snapshot`,
          collabSubmitChangesetUrl: `${endpoint}/comb`,
          collabWebSocketUrl: `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/universer-api/comb/connect`,
          wsSessionTicketUrl: `${endpoint}/user/session-ticket`,
        }
      : createWorktreeCollaborationConfig({ origin: location.origin, worktreeID });
  const { univerAPI } = createUniver({
    collaboration: true,
    locale: LocaleType.EN_US,
    locales: {
      [LocaleType.EN_US]: mergeLocales(
        UniverPresetSheetsCoreEnUS,
        UniverPresetDocsCoreEnUS,
        UniverDesignEnUS,
        UniverUIEnUS,
        UniverDocsUIEnUS,
        UniverDrawingUIEnUS,
        UniverSlidesEnUS,
        UniverSlidesUIEnUS,
        CollaborationClientEnUS,
        CollaborationClientUIEnUS,
      ),
    },
    logLevel: LogLevel.WARN,
    theme: defaultTheme,
    presets: [
      {
        plugins: [[UniverLicensePlugin, { license: import.meta.env.UNIVER_LICENSE || undefined }]],
      },
      editorPreset(unitType),
    ],
    plugins: [
      UniverCollaborationPlugin,
      [
        UniverCollaborationClientPlugin,
        {
          socketService: BrowserCollaborationSocketService,
          sendChangesetTimeout: 200,
          ...collaborationConfig,
        },
      ],
      UniverCollaborationClientUIPlugin,
    ],
  });

  switch (unitType) {
    case "sheet":
      await univerAPI.getCollaboration().loadSheetAsync(unitId);
      break;
    case "doc":
      await univerAPI.getCollaboration().loadDocAsync(unitId);
      break;
    case "slide":
      await univerAPI.getCollaboration().loadSlideAsync(unitId);
  }
  document.querySelector("#status")!.textContent =
    worktree === undefined
      ? `${unitType} · ${unitId} · trunk · read-only`
      : `${unitType} · ${unitId} · worktree ${worktree.worktreeID} · ${worktree.status}`;
}

function renderReviewActions(worktree: WorktreeData): void {
  const actions = document.querySelector("#review-actions")!;
  const client = new WorktreeClient({ origin: location.origin });
  if (worktree.status === "draft") {
    actions.append(actionButton("Ready", () => client.markReady(worktree.worktreeID)));
  }
  if (worktree.status === "ready") {
    actions.append(
      actionButton("Reopen", () => client.reopenWorktree(worktree.worktreeID)),
      actionButton("Merge", () => client.mergeWorktree(worktree.worktreeID)),
    );
  }
}

function actionButton(label: string, action: () => Promise<WorktreeData>): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", async () => {
    button.disabled = true;
    await action();
    location.reload();
  });
  return button;
}

function editorPreset(unitType: UnitType): IPreset {
  switch (unitType) {
    case "sheet":
      return UniverSheetsCorePreset({ container: "app" });
    case "doc":
      return UniverDocsCorePreset({ container: "app" });
    case "slide":
      return {
        plugins: [
          UniverNetworkPlugin,
          UniverRenderEnginePlugin,
          [UniverUIPlugin, { container: "app" }],
          UniverDocsPlugin,
          UniverDocsUIPlugin,
          [UniverDrawingPlugin, { override: [[IImageIoService, null]] }],
          UniverSlidesPlugin,
          UniverSlidesUIPlugin,
        ],
      };
  }
}
