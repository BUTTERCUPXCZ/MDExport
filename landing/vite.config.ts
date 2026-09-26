/// <reference types="vitest/config" />
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Relative asset paths: works on GitHub Pages, Vercel, Netlify or any static host.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  // Two pages: the landing page and the docs.
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        docs: path.resolve(__dirname, "docs.html"),
      },
    },
  },
  test: { environment: "jsdom" },
});
