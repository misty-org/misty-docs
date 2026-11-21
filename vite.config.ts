// The docs site. `npm run dev` serves it; `npm run build` writes dist/, plain static files.
// Each repository's docs are read from where sources.json says (see scripts/sync-sources.mjs).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { resolveSources } from "./scripts/sync-sources.mjs";

const sources = resolveSources() as Record<string, string>;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // The component examples live in misty-ui and bring its own node_modules; one React for everything.
    dedupe: ["react", "react-dom"],
    alias: {
      "@docs-sdk": `${sources.sdk}/docs`,
      "@docs-ui": sources.ui,
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5192,
    strictPort: true,
    // misty-website starts this server and serves it on docs.localhost.
    allowedHosts: [".localhost"],
    fs: { allow: [process.cwd(), ...Object.values(sources)] },
  },
});
