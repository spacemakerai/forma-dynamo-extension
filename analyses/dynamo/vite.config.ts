import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        floating: resolve(__dirname, "src/floatingpanel/index.html"),
        index: resolve(__dirname, "index.html"),
        left: resolve(__dirname, "src/leftpanel/index.html"),
      },
    },
  },
  plugins: [preact()],
  server: {
    port: 8081,
  },
  optimizeDeps: {
    exclude: ["forma-embedded-view-sdk"],
  },
});
