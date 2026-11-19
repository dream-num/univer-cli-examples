import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  define: {
    "import.meta.env.UNIVER_LICENSE": JSON.stringify(process.env["UNIVER_LICENSE"] ?? ""),
  },
  root: resolve(import.meta.dirname, "src/web"),
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, "dist/web"),
    target: "es2022",
  },
});
