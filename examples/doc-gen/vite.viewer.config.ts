import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, "dist/viewer"),
    rollupOptions: {
      input: resolve(import.meta.dirname, "src/viewer/index.html"),
    },
    target: "es2022",
  },
});
