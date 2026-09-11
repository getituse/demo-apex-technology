import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

import { staticPreview404 } from "./scripts/lib/static-preview";
import { siteBasePath } from "./src/lib/site-url";
import { config } from "./src/site";

const basePath = siteBasePath(config.siteUrl);
const base = basePath === "/" ? "/" : `${basePath}/`;

export default defineConfig(({ isPreview }) => ({
  base,
  // Production preview serves only the generated static files.
  ...(isPreview ? { appType: "mpa" as const } : {}),
  plugins: isPreview ? [staticPreview404()] : [reactRouter()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1" },
}));
