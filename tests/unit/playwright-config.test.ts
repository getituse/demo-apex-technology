// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "../../playwright.config";

describe("production Playwright launch contract", () => {
  it("covers each tenant at desktop and 360px mobile without retries", () => {
    expect(config.projects).toHaveLength(2);
    const projects = config.projects!.filter((project) =>
      project.name?.startsWith("apex-technology-"),
    );
    expect(projects.map((project) => project.use?.viewport?.width)).toEqual([1440, 360]);
    for (const project of projects) expect(project.use?.tenantId).toBe("apex-technology");
    expect(config.workers).toBe(1);
    expect(config.retries).toBe(0);
    expect(config.use?.serviceWorkers).toBe("block");
  });

  it("owns one real IPv4 production preview per tenant with no dev reuse", () => {
    const server = Array.isArray(config.webServer) ? config.webServer[0]! : config.webServer!;
    const port = 5412;
    expect(server.command).toContain(
      `vite.js preview --host 127.0.0.1 --port ${port} --strictPort --outDir dist`,
    );
    expect(server.command).not.toMatch(/localhost|react-router dev|vite dev/);
    expect(server.url).toBe(`http://127.0.0.1:${port}/`);
    expect(server.reuseExistingServer).toBe(false);
    expect(
      config.projects!.filter((project) => project.use?.baseURL === `http://127.0.0.1:${port}`),
    ).toHaveLength(2);
  });

  it("builds fresh static output before the npm E2E command and records reports", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(manifest.scripts["pretest:e2e"]).toBe("react-router build");
    expect(manifest.scripts["test:e2e"]).toBe("playwright test");
    expect(manifest.scripts.test).toBe("vitest run");
    expect(config.reporter).toContainEqual(["json", { outputFile: "build/e2e/results.json" }]);
    expect(config.outputDir).toBe("build/e2e/artifacts");
  });
});
