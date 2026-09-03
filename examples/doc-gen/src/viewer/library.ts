import type { IDocumentData } from "@univerjs/core";

export type DocumentLoader = () => Promise<unknown>;

export interface LibraryEntry {
  readonly load: DocumentLoader;
  readonly slug: string;
}

const DOCUMENT_PATH = /^\.\.\/\.\.\/output\/([^/]+)\/document\.json$/;

export function discoverDocuments(
  modules: Readonly<Record<string, DocumentLoader>>,
): LibraryEntry[] {
  return Object.entries(modules)
    .flatMap(([path, load]) => {
      const match = DOCUMENT_PATH.exec(path);
      return match?.[1] === undefined ? [] : [{ load, slug: match[1] }];
    })
    .sort((left, right) => (left.slug < right.slug ? -1 : left.slug > right.slug ? 1 : 0));
}

export function toReadOnlyDocument(value: unknown): IDocumentData {
  if (!isRecord(value) || typeof value["id"] !== "string" || value["id"].trim() === "") {
    throw new Error("document.json must contain a non-empty id");
  }
  return { ...(value as unknown as IDocumentData), disabled: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
