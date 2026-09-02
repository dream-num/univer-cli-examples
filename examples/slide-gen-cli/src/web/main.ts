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
import { UniverSlidesChartPlugin } from "@univerjs-pro/slides-chart";
import { UniverSlidesChartUIPlugin } from "@univerjs-pro/slides-chart-ui";
import "@univerjs-pro/slides-chart-ui/lib/index.css";
import UniverSlidesChartUIEnUS from "@univerjs-pro/slides-chart-ui/locale/en-US";
import { UniverSlidesTablePlugin } from "@univerjs-pro/slides-table";
import { UniverSlidesTableUIPlugin } from "@univerjs-pro/slides-table-ui";
import "@univerjs-pro/slides-table-ui/lib/index.css";
import UniverSlidesTableUIEnUS from "@univerjs-pro/slides-table-ui/locale/en-US";
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
import { createUniver, defaultTheme, mergeLocales, type IPreset } from "@univerjs/presets";
import { UniverUIPlugin } from "@univerjs/ui";
import "@univerjs/ui/lib/index.css";
import UniverUIEnUS from "@univerjs/ui/locale/en-US";
import { parseUnitType, unitTypeLabel, type UnitSummary } from "../shared/unit.js";
import { createUnitUrl, viewerUrl, worktreesUrl } from "../shared/urls.js";
import "./styles.css";

const search = new URL(location.href).searchParams;
const unitId = search.get("unit");
const worktreeID = search.get("worktree");
const [units, worktrees] = await Promise.all([
  fetch(createUnitUrl(location.origin)).then(
    async (response) => (await response.json()) as UnitSummary[],
  ),
  fetch(worktreesUrl(location.origin)).then(
    async (response) => (await response.json()) as WorktreeData[],
  ),
]);
renderUnits(units, worktreeID === null ? unitId : null);
renderWorktrees(worktrees, units, unitId, worktreeID);
installCreateButton();

if (unitId !== null) {
  const unit = units.find((item) => item.unitId === unitId);
  if (unit === undefined) throw new Error(`Unknown Unit ${unitId}`);
  parseUnitType(unit.unitType);
  await mountEditor(unitId, worktreeID);
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
    type.textContent = unitTypeLabel();
    const name = document.createElement("span");
    name.className = "unit-name";
    name.textContent = unit.name;
    button.append(type, name);
    list.append(button);
  }
}

function renderWorktrees(
  worktrees: readonly WorktreeData[],
  units: readonly UnitSummary[],
  activeUnitId: string | null,
  activeWorktreeID: string | null,
): void {
  const list = document.querySelector("#worktree-list")!;
  if (worktrees.length === 0) {
    const empty = document.createElement("p");
    empty.className = "sidebar-empty";
    empty.textContent = "No worktrees yet";
    list.append(empty);
    return;
  }

  for (const worktree of worktrees) {
    const targetUnitID =
      worktree.units.find((unit) => unit.unitID === activeUnitId)?.unitID ??
      worktree.units[0]?.unitID;
    const targetUnit = units.find((unit) => unit.unitId === targetUnitID);
    const button = document.createElement("button");
    button.className = `worktree-link${worktree.worktreeID === activeWorktreeID ? " active" : ""}`;
    button.type = "button";
    button.disabled = targetUnitID === undefined;
    button.addEventListener("click", () => {
      if (targetUnitID !== undefined) {
        location.assign(viewerUrl(location.origin, targetUnitID, worktree.worktreeID));
      }
    });

    const icon = document.createElement("span");
    icon.className = "worktree-icon";
    icon.ariaHidden = "true";
    icon.textContent = "WT";
    const copy = document.createElement("span");
    copy.className = "worktree-copy";
    const name = document.createElement("span");
    name.className = "worktree-name";
    name.textContent = targetUnit?.name ?? targetUnitID ?? "Empty worktree";
    const id = document.createElement("span");
    id.className = "worktree-id";
    id.textContent = worktree.worktreeID;
    copy.append(name, id);
    const status = document.createElement("span");
    status.className = "worktree-status";
    status.dataset.status = worktree.status;
    status.textContent = worktree.status;
    button.append(icon, copy, status);
    list.append(button);
  }
}

function installCreateButton(): void {
  document.querySelector("#create-form")!.addEventListener("submit", async (event) => {
    event.preventDefault();
    const response = await fetch(createUnitUrl(location.origin), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const unit = (await response.json()) as UnitSummary;
    location.assign(viewerUrl(location.origin, unit.unitId));
  });
}

async function mountEditor(unitId: string, worktreeID: string | null): Promise<void> {
  document.querySelector<HTMLElement>("#empty")!.style.display = "none";
  const app = document.querySelector<HTMLElement>("#app")!;
  app.style.display = "block";
  document.querySelector("#status")!.textContent = "Connecting…";

  const endpoint = `${location.origin}/universer-api`;
  let worktree: WorktreeData | undefined;
  if (worktreeID === null) {
    app.inert = false;
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
        UniverDesignEnUS,
        UniverUIEnUS,
        UniverDocsUIEnUS,
        UniverDrawingUIEnUS,
        UniverSlidesEnUS,
        UniverSlidesUIEnUS,
        UniverSlidesChartUIEnUS,
        UniverSlidesTableUIEnUS,
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
      editorPreset(),
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

  await univerAPI.getCollaboration().loadSlideAsync(unitId);
  document.querySelector("#status")!.textContent =
    worktree === undefined
      ? `slide · ${unitId} · trunk · editable`
      : `slide · ${unitId} · worktree ${worktree.worktreeID} · ${worktree.status}`;
}

function renderReviewActions(worktree: WorktreeData): void {
  const actions = document.querySelector("#review-actions")!;
  const client = new WorktreeClient({ origin: location.origin });
  if (worktree.status === "draft") {
    actions.append(
      actionButton("Discard", "discard", () => client.discardWorktree(worktree.worktreeID)),
      actionButton("Ready", "default", () => client.markReady(worktree.worktreeID)),
    );
  }
  if (worktree.status === "ready") {
    actions.append(
      actionButton("Discard", "discard", () => client.discardWorktree(worktree.worktreeID)),
      actionButton("Reopen", "default", () => client.reopenWorktree(worktree.worktreeID)),
      actionButton("Merge", "merge", () => client.mergeWorktree(worktree.worktreeID)),
    );
  }
}

type ReviewActionTone = "default" | "merge" | "discard";

function actionButton(
  label: string,
  tone: ReviewActionTone,
  action: () => Promise<WorktreeData>,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = `review-action review-action-${tone}`;
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", async () => {
    button.disabled = true;
    await action();
    location.reload();
  });
  return button;
}

function editorPreset(): IPreset {
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
      UniverSlidesChartPlugin,
      UniverSlidesChartUIPlugin,
      UniverSlidesTablePlugin,
      UniverSlidesTableUIPlugin,
    ],
  };
}
