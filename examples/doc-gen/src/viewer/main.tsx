import { createPresetRenderUniver } from "@univer-cli/univer-render-page";
import { type Univer, UniverInstanceType } from "@univerjs/core";
import { FUniver } from "@univerjs/core/facade";
import "@univerjs/ui/facade";
import { BookOpenText, Library, LockKeyhole, RefreshCw } from "lucide-react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { UNIVER_LICENSE } from "../shared/license";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { discoverDocuments, toReadOnlyDocument, type LibraryEntry } from "./library";
import "./styles.css";

const documentModules = import.meta.glob("../../output/*/document.json", {
  import: "default",
});

const entries = discoverDocuments(documentModules);
const viewer = requireElement<HTMLElement>("#viewer");
const root = createRoot(viewer);
flushSync(() => root.render(<ViewerShell />));

const statusText = requireElement<HTMLElement>("#status-text");
const error = requireElement<HTMLElement>("#error");
const app = requireElement<HTMLElement>("#app");
const title = requireElement<HTMLElement>("#document-title");
const buttons = [...document.querySelectorAll<HTMLButtonElement>("#document-list button")];

let mountedUniver: Univer | undefined;
let selectedSlug: string | undefined;
let switching = false;

window.addEventListener("pagehide", disposeMountedUniver);

for (const eventName of ["beforeinput", "cut", "drop", "paste"]) {
  app.addEventListener(eventName, (event) => event.preventDefault(), { capture: true });
}

const firstEntry = entries[0];
if (firstEntry !== undefined) void selectDocument(firstEntry);

function ViewerShell() {
  return (
    <main className="grid h-full w-full grid-cols-[220px_minmax(0,1fr)] overflow-hidden bg-muted/50 md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col bg-background" aria-label="Local Doc Library">
        <header className="flex items-center gap-3 px-4 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
            <Library className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 leading-none">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Doc Gen
            </p>
            <h1 className="mt-1.5 truncate text-base font-semibold tracking-tight">Library</h1>
          </div>
        </header>

        <div className="flex h-10 items-center justify-between px-3">
          <span className="text-xs font-medium text-muted-foreground">Documents</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Refresh document library"
            title="Refresh document library"
            onClick={() => location.reload()}
          >
            <RefreshCw aria-hidden="true" />
          </Button>
        </div>
        <Separator />

        <nav
          id="document-list"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2"
          aria-label="Generated documents"
        >
          {entries.map((entry) => (
            <Button
              key={entry.slug}
              variant="ghost"
              className="document-button h-10 w-full justify-start px-3 font-normal data-[active=true]:bg-accent data-[active=true]:font-medium"
              data-active="false"
              data-slug={entry.slug}
              onClick={() => void selectDocument(entry)}
            >
              <BookOpenText className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{entry.slug}</span>
            </Button>
          ))}
          {entries.length === 0 && (
            <p id="empty-state" className="px-3 py-4 text-xs leading-relaxed text-muted-foreground">
              No documents found. Build one into <code>output/&lt;slug&gt;</code>.
            </p>
          )}
        </nav>

        <footer className="p-3">
          <Separator className="mb-3" />
          <code className="block truncate text-[10px] text-muted-foreground">
            output/&lt;slug&gt;/document.json
          </code>
        </footer>
      </aside>

      <section
        className="grid min-h-0 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)]"
        aria-label="Document viewer"
      >
        <header className="flex min-h-[72px] items-center justify-between gap-4 bg-background px-5">
          <div className="min-w-0">
            <h2 id="document-title" className="truncate text-lg font-semibold tracking-tight">
              Choose a document
            </h2>
          </div>
          <Badge
            id="status"
            variant="outline"
            className="gap-1.5 px-2.5 py-1 text-[10px] text-muted-foreground"
            role="status"
          >
            <LockKeyhole aria-hidden="true" />
            <span id="status-text">Ready</span>
          </Badge>
        </header>
        <p
          id="error"
          className="border-b border-destructive/20 bg-destructive/10 px-5 py-2 text-xs text-destructive"
          role="alert"
          hidden
        />
        <div
          id="app"
          className="min-h-0 min-w-0 overflow-hidden"
          aria-label="Selected Materialized Doc"
        />
      </section>
    </main>
  );
}

async function selectDocument(entry: LibraryEntry): Promise<void> {
  if (switching) return;
  if (selectedSlug === entry.slug && mountedUniver !== undefined) {
    error.hidden = true;
    statusText.textContent = "Ready · read only";
    return;
  }

  switching = true;
  setButtonsDisabled(true);
  error.hidden = true;
  statusText.textContent = `Loading ${entry.slug}…`;
  let nextUniver: Univer | undefined;

  try {
    const document = toReadOnlyDocument(await entry.load());
    disposeMountedUniver();

    nextUniver = await createPresetRenderUniver({ container: app, license: UNIVER_LICENSE });
    const univerAPI = FUniver.newAPI(nextUniver);
    univerAPI.setUIVisible(univerAPI.Enum.BuiltInUIPart.TOOLBAR, false);
    univerAPI.setUIVisible(univerAPI.Enum.BuiltInUIPart.FLOATING, false);
    nextUniver.createUnit(UniverInstanceType.UNIVER_DOC, document);
    mountedUniver = nextUniver;
    nextUniver = undefined;
    selectedSlug = entry.slug;
    title.textContent = document.title?.trim() || entry.slug;
    statusText.textContent = "Ready · read only";
    for (const button of buttons) {
      const active = button.dataset.slug === selectedSlug;
      button.dataset.active = String(active);
      button.setAttribute("aria-current", active ? "page" : "false");
    }
  } catch (cause) {
    nextUniver?.dispose();
    if (mountedUniver === undefined) {
      selectedSlug = undefined;
      title.textContent = "Unable to load document";
    }
    error.textContent = cause instanceof Error ? cause.message : String(cause);
    error.hidden = false;
    statusText.textContent = "Load failed";
  } finally {
    switching = false;
    setButtonsDisabled(false);
  }
}

function disposeMountedUniver(): void {
  mountedUniver?.dispose();
  mountedUniver = undefined;
}

function setButtonsDisabled(disabled: boolean): void {
  for (const button of buttons) button.disabled = disabled;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`${selector} is required`);
  return element;
}
