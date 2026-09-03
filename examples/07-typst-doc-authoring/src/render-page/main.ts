import { createPresetRenderUniver, mountUniverRenderPage } from "@univer-cli/univer-render-page";

const container = document.querySelector<HTMLElement>("#app");
if (container === null) throw new Error("#app is required");

await mountUniverRenderPage({ container, createUniver: createPresetRenderUniver });
