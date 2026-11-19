import { resolveUniverRenderBrowser } from "@univer-cli/univer-render-runtime";
import puppeteer from "puppeteer-core";
import { ErrorCode, type IAllowedRequest } from "@univerjs/protocol";
import { WorktreeClient } from "@univerjs-pro/collaboration-worktree-client";
import { beforeEach, expect, it } from "vitest";
import { startTestServer } from "./start-test-server.js";

let origin: string;

beforeEach(async () => {
  ({ origin } = await startTestServer());
});

it("creates only empty Slide units and keeps unit and Worktree routes available", async () => {
  const ticket = await fetch(`${origin}/universer-api/user/session-ticket`);
  expect(ticket.status).toBe(200);
  expect(await ticket.json()).toMatchObject({ ticket: expect.any(String) });
  const fallback = await fetch(`${origin}/universer-api/not-an-endpoint`);
  expect(fallback.status).toBe(200);
  expect(await fallback.text()).toContain('id="sidebar"');

  const unnamed = await create({});
  expect(unnamed).toMatchObject({ name: "Untitled Slide", unitType: "slide", revision: 1 });

  const named = await create({ unitId: "named-slide", name: "Named Slide" });
  expect(named).toMatchObject({ unitId: "named-slide", name: "Named Slide", unitType: "slide" });

  const legacy = await create({
    unitId: "legacy-input",
    name: "Still a Slide",
    type: "sheet",
    data: { id: "forged-sheet", sheets: { sheet1: {} } },
  });
  expect(legacy).toMatchObject({
    unitId: "legacy-input",
    name: "Still a Slide",
    unitType: "slide",
  });

  expect(await getJson("/api/units/named-slide")).toEqual({
    unitId: "named-slide",
    name: "Named Slide",
    unitType: "slide",
  });
  expect(await getJson("/api/units")).toEqual([
    { unitId: legacy.unitId, name: legacy.name, unitType: "slide" },
    { unitId: named.unitId, name: named.name, unitType: "slide" },
    { unitId: unnamed.unitId, name: unnamed.name, unitType: "slide" },
  ]);
  expect(await getJson("/api/worktrees")).toEqual([]);
  const client = new WorktreeClient({ origin });
  await client.createWorktree({ worktreeID: "z-draft", units: ["named-slide"] });
  await client.createWorktree({ worktreeID: "a-empty" });
  await client.markReady("z-draft");
  expect(await getJson("/api/worktrees")).toEqual([
    { worktreeID: "a-empty", status: "draft", units: [] },
    { worktreeID: "z-draft", status: "ready", units: [{ unitID: "named-slide" }] },
  ]);
});

it("loads server permissions for the trunk and Ready draft", async () => {
  await create({ unitId: "review-slide" });
  const client = new WorktreeClient({ origin });
  await client.createWorktree({ worktreeID: "review-draft", units: ["review-slide"] });
  await client.markReady("review-draft");

  const resolution = await resolveUniverRenderBrowser();
  if (resolution.status === "missing") throw new Error("A render browser is required");
  const browser = await puppeteer.launch({
    executablePath: resolution.executablePath,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    for (const [query, status] of [
      ["?unit=review-slide", "trunk · editable"],
      ["?unit=review-slide&worktree=review-draft", "worktree review-draft · ready"],
    ] as const) {
      const [permissions] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url() === origin + "/universer-api/authz/-/object/-/batch_allowed" &&
            response.request().method() === "POST",
        ),
        page.goto(origin + "/" + query),
      ]);
      expect(permissions.status()).toBe(200);
      const { requests } = JSON.parse(permissions.request().postData()!) as {
        requests: IAllowedRequest[];
      };
      expect(requests.length).toBeGreaterThan(0);
      expect(await permissions.json()).toEqual({
        error: { code: ErrorCode.OK, message: "" },
        objectActions: requests.map(({ unitID, objectID, actions }) => ({
          unitID,
          objectID,
          actions: actions.map((action) => ({ action, allowed: true })),
        })),
      });
      await page.waitForFunction(
        (expected) => document.querySelector("#status")?.textContent?.endsWith(expected),
        {},
        status,
      );
    }
  } finally {
    await browser.close();
  }
}, 60_000);

async function create(body: object): Promise<Record<string, unknown>> {
  const response = await fetch(`${origin}/api/units`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as Record<string, unknown>;
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${origin}${path}`);
  expect(response.status).toBe(200);
  return await response.json();
}
