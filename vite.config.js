import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages serves this project below /AI-Morning-Magazine/.
  // Relative asset URLs keep the same build usable on both Pages and local preview.
  base: "./",
  build: { outDir: "dist/client", emptyOutDir: true },
});
