import {
  createResourceLibrary,
  FilesystemResourceCache,
  FilesystemResourceOutput,
  type ResourceLibrary,
} from "@univer-cli/resource-library";
import { join } from "node:path";

export const ROCKET_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3"/><path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3"/><path d="M14 9a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg>';

const manifest = {
  registrations: [
    {
      input: {
        registryId: "example-tabler-outline",
        groups: [{ id: "tabler-map", label: "Map" }],
        tags: [{ id: "variant-outline", label: "Outline" }],
        defaults: { storagePolicy: "reference" },
        resources: [
          {
            id: "rocket",
            name: "Rocket",
            groupId: "tabler-map",
            tagIds: ["variant-outline"],
            keywords: ["rocket", "space"],
            order: 1,
            preview: { type: "url", value: "https://example.test/rocket.svg" },
            payload: {
              type: "image",
              source: { type: "url", value: "https://example.test/rocket.svg" },
              intrinsicSize: { width: 24, height: 24 },
              storagePolicy: "reference",
              colorEditable: true,
            },
          },
        ],
      },
    },
  ],
};

export function createFixtureResourceLibrary(root: string): ResourceLibrary {
  return createResourceLibrary({
    manifest,
    cache: new FilesystemResourceCache(join(root, "cache")),
    downloader: { download: async () => ROCKET_SVG },
    output: new FilesystemResourceOutput(),
  });
}
