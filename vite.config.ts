import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { sharedDependencies } from "./scripts/shared_dependencies.mjs";
import { resolveSources } from "./scripts/sync_sources.mjs";

const sources = resolveSources() as Record<string, string>;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: sharedDependencies(sources.ui, import.meta.dirname),
    alias: {
      "@docs-sdk": `${sources.sdk}/docs`,
      "@docs-ui": sources.ui,
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5192,
    strictPort: true,
    allowedHosts: [".localhost"],
    fs: { allow: [process.cwd(), ...Object.values(sources)] },
  },
});
