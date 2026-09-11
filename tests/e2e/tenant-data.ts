import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import type { TenantContent } from "../../src/config/content-schema";
import type { TenantConfig } from "../../src/config/tenant-schema";

export interface TenantModule {
  config: TenantConfig;
  content: TenantContent;
}

let cached: Promise<TenantModule> | null = null;

export function loadTenantData(_tenantId?: string): Promise<TenantModule> {
  if (!cached) {
    cached = (async () => {
      // Compile authoring inputs only: no listener, app config/hooks, env files or HMR.
      // Native Node rejects the bundler-style JSON imports in authored PDF metadata.
      const root = fileURLToPath(new URL("../../", import.meta.url));
      const compiler = await createServer({
        root,
        configFile: false,
        envFile: false,
        appType: "custom",
        logLevel: "error",
        resolve: { alias: { "@": path.join(root, "src") } },
        server: { middlewareMode: true, hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true, include: [] },
      });
      try {
        const site = (await compiler.ssrLoadModule("/src/site/index.ts")) as TenantModule;
        return site;
      } finally {
        await compiler.close();
      }
    })();
  }
  return cached;
}
