import { expect, it } from "vitest";

import { discoverDocuments, toReadOnlyDocument, type DocumentLoader } from "../src/viewer/library";

it("discovers only one-level Local Doc Library entries in stable order", () => {
  const load: DocumentLoader = async () => ({});
  const entries = discoverDocuments({
    "../../elsewhere/gamma/document.json": load,
    "../../output/alpha/other.json": load,
    "../../output/beta/document.json": load,
    "../../output/nested/gamma/document.json": load,
    "../../output/alpha/document.json": load,
  });

  expect(entries.map(({ slug }) => slug)).toEqual(["alpha", "beta"]);
  expect(entries.every((entry) => entry.load === load)).toBe(true);
});

it("validates and disables a Materialized Doc without mutating its source", () => {
  const source = { id: "brief", title: "Release brief", disabled: false };

  expect(toReadOnlyDocument(source)).toEqual({ ...source, disabled: true });
  expect(source.disabled).toBe(false);
  expect(() => toReadOnlyDocument({})).toThrow("non-empty id");
  expect(() => toReadOnlyDocument({ id: "  " })).toThrow("non-empty id");
  expect(() => toReadOnlyDocument([])).toThrow("non-empty id");
});
