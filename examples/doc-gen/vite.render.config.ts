import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(import.meta.dirname, "src/render-page"),
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, "dist/render-page"),
    target: "es2022",
  },
});
