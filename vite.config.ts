import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const dynAsJsonPlugin = () => ({
  name: "dyn-as-json",
  transform(src, id) {
    if (id.endsWith(".dyn")) {
      return {
        code: `export default ${src}`,
        map: null,
      };
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {
    sourcemap: true,
  },
  plugins: [preact(), dynAsJsonPlugin()],
  server: {
    port: 8081,
  },
  optimizeDeps: {
    exclude: ["forma-embedded-view-sdk"],
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
});
