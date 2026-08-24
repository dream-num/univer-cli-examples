import { createPresetRenderUniver, mountUniverRenderPage } from "@univer-cli/univer-render-page";

const container = document.querySelector<HTMLElement>("#app")!;
await mountUniverRenderPage({ container, createUniver: createPresetRenderUniver });
