import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "lucide-react": fileURLToPath(
        new URL("./src/lib/lucide-stubs.tsx", import.meta.url)
      ),
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    rollupOptions: {
      plugins: [
        visualizer({
          filename: "dist/bundle-stats.html",
          gzipSize: true,
          brotliSize: true,
          template: "treemap",
          open: false,
        }),
      ],
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts", "d3-scale", "d3-shape", "d3-array"],
          form: ["react-hook-form", "yup"],
          redux: ["@reduxjs/toolkit"],
          utils: ["axios", "decimal.js-light"],
        },
      },
    },
  },
});
