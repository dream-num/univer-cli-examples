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
import { UNIVER_LICENSE } from "../shared/license.js";
import { parseUnitType, unitTypeLabel, type UnitSummary } from "../shared/unit.js";
import { createUnitUrl, viewerUrl, worktreesUrl } from "../shared/urls.js";
import "./styles.css";

type SidebarTab = "files" | "worktrees";
type SelectView = (unitId: string, worktreeID: string | null) => Promise<void>;

interface MountedEditor {
  readonly unitId: string;
  readonly worktreeID: string | null;
  dispose(): void;
  flush(): Promise<void>;
}

let mountedEditor: MountedEditor | undefined;
let switchingEditor = false;

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
installSidebarTabs(worktreeID === null ? "files" : "worktrees");
renderUnits(units, worktreeID === null ? unitId : null, switchEditor);
renderWorktrees(worktrees, units, unitId, worktreeID, switchEditor);
installCreateButton();

if (unitId !== null) {
  await switchEditor(unitId, worktreeID);
}

async function switchEditor(targetUnitId: string, targetWorktreeID: string | null): Promise<void> {
  if (
    switchingEditor ||
    (mountedEditor?.unitId === targetUnitId && mountedEditor.worktreeID === targetWorktreeID)
  ) {
    return;
  }

  const unit = units.find((item) => item.unitId === targetUnitId);
  if (unit === undefined) throw new Error(`Unknown Unit ${targetUnitId}`);
  parseUnitType(unit.unitType);

  switchingEditor = true;
  const sidebar = document.querySelector<HTMLElement>("#sidebar")!;
  sidebar.inert = true;
  try {
    await mountedEditor?.flush();
    mountedEditor?.dispose();
    mountedEditor = undefined;
    resetEditor();
    history.replaceState(
      null,
      "",
      viewerUrl(location.origin, targetUnitId, targetWorktreeID ?? undefined),
    );
    setActiveNavigation(targetUnitId, targetWorktreeID);
    mountedEditor = await mountEditor(targetUnitId, targetWorktreeID);
  } catch (error) {
    document.querySelector("#status")!.textContent =
      error instanceof Error ? error.message : "Unable to switch Slide";
    console.error(error);
  } finally {
    sidebar.inert = false;
    switchingEditor = false;
  }
}

function resetEditor(): void {
  const app = document.querySelector<HTMLElement>("#app")!;
  app.replaceChildren();
  delete app.dataset.editorLocked;
  document.querySelector("#review-actions")!.replaceChildren();
}

function setActiveNavigation(activeUnitId: string, activeWorktreeID: string | null): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(".unit-link")) {
    button.classList.toggle(
      "active",
      activeWorktreeID === null && button.dataset.unitId === activeUnitId,
    );
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>(".worktree-link")) {
    button.classList.toggle("active", button.dataset.worktreeId === activeWorktreeID);
  }
}

function installSidebarTabs(initialTab: SidebarTab): void {
  const tabs = (["files", "worktrees"] as const).map((name) => ({
    button: document.querySelector<HTMLButtonElement>(`#${name}-tab`)!,
    name,
    panel: document.querySelector<HTMLElement>(`#${name}-panel`)!,
  }));

  const select = (selected: SidebarTab): void => {
    for (const tab of tabs) {
      const active = tab.name === selected;
      tab.button.ariaSelected = String(active);
      tab.button.tabIndex = active ? 0 : -1;
      tab.panel.hidden = !active;
    }
  };

  for (const [index, tab] of tabs.entries()) {
    tab.button.addEventListener("click", () => select(tab.name));
    tab.button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const next =
        tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length]!;
      select(next.name);
      next.button.focus();
    });
  }

  select(initialTab);
}

function renderUnits(
  units: readonly UnitSummary[],
  activeUnitId: string | null,
  selectView: SelectView,
): void {
  const list = document.querySelector("#unit-list")!;
  for (const unit of units) {
    const button = document.createElement("button");
    button.className = `unit-link${unit.unitId === activeUnitId ? " active" : ""}`;
    button.dataset.unitId = unit.unitId;
    button.type = "button";
    button.addEventListener("click", () => void selectView(unit.unitId, null));

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
  selectView: SelectView,
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
    button.dataset.worktreeId = worktree.worktreeID;
    button.type = "button";
    button.disabled = targetUnitID === undefined;
    button.addEventListener("click", () => {
      if (targetUnitID !== undefined) {
        void selectView(targetUnitID, worktree.worktreeID);
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

async function mountEditor(unitId: string, worktreeID: string | null): Promise<MountedEditor> {
  document.querySelector<HTMLElement>("#empty")!.style.display = "none";
  const app = document.querySelector<HTMLElement>("#app")!;
  app.style.display = "block";
  document.querySelector("#status")!.textContent = "Connecting…";

  const endpoint = `${location.origin}/universer-api`;
  let worktree: WorktreeData | undefined;
  if (worktreeID !== null) {
    worktree = await new WorktreeClient({ origin: location.origin }).getWorktree(worktreeID);
    if (!worktree.units.some((unit) => unit.unitID === unitId)) {
      throw new Error(`Worktree ${worktreeID} does not contain Unit ${unitId}`);
    }
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
  await ensureAnimationFramesProgress();
  const { univer, univerAPI } = createUniver({
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
    presets: [{ plugins: [[UniverLicensePlugin, { license: UNIVER_LICENSE }]] }, editorPreset()],
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

  const collaboration = univerAPI.getCollaboration();
  await collaboration.loadSlideAsync(unitId);
  lockEditorMutation(app, worktree !== undefined && worktree.status !== "draft");
  document.querySelector("#status")!.textContent =
    worktree === undefined
      ? `slide · ${unitId} · trunk · editable`
      : `slide · ${unitId} · worktree ${worktree.worktreeID} · ${worktree.status}`;
  return {
    unitId,
    worktreeID,
    dispose: () => univer.dispose(),
    flush: () =>
      worktree === undefined || worktree.status === "draft"
        ? collaboration.flush(unitId)
        : Promise.resolve(),
  };
}

async function ensureAnimationFramesProgress(): Promise<void> {
  const nativeRequest = window.requestAnimationFrame.bind(window);
  const progressed = await Promise.race([
    new Promise<true>((resolve) => nativeRequest(() => resolve(true))),
    new Promise<false>((resolve) => window.setTimeout(() => resolve(false), 100)),
  ]);
  if (progressed) return;

  // Univer releases its initial workbench skeleton after two animation frames.
  // Keep rendering usable in browsers that expose requestAnimationFrame but do not advance it.
  window.requestAnimationFrame = (callback) =>
    window.setTimeout(() => callback(performance.now()), 16);
  window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
}

function lockEditorMutation(app: HTMLElement, locked: boolean): void {
  if (locked && app.querySelector('[data-u-comp="workbench-skeleton-shimmer"]')) {
    const observer = new MutationObserver(() => {
      if (!app.querySelector('[data-u-comp="workbench-skeleton-shimmer"]')) {
        observer.disconnect();
        lockEditorMutation(app, true);
      }
    });
    observer.observe(app, { childList: true, subtree: true });
    return;
  }

  const thumbnailSelector = '[data-u-comp="slide-thumbnail-item"]';
  const setLocked = (element: Element | null): void => {
    if (element instanceof HTMLElement) element.inert = locked;
  };

  setLocked(app.querySelector('[data-u-comp="headerbar"]'));
  const leftSidebar = app.querySelector('[data-u-comp="left-sidebar"]');
  const slideRail = leftSidebar?.firstElementChild;
  for (const child of slideRail?.children ?? []) {
    if (!child.querySelector(thumbnailSelector)) setLocked(child);
  }
  for (const child of leftSidebar?.parentElement?.children ?? []) {
    if (!child.contains(leftSidebar)) setLocked(child);
  }
  app.dataset.editorLocked = String(locked);
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
