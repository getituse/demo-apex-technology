import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
  type Request,
  type Response,
} from "@playwright/test";

import type { TenantContent } from "../../src/config/content-schema";
import type { TenantConfig } from "../../src/config/tenant-schema";
import { loadTenantData } from "./tenant-data";

export type TenantId = "apex-technology";
export { expect };

type Problem = { kind: string; url?: string; message?: string; status?: number };
type ConsoleEntry = { type: string; text: string; url: string; pageId: number | null };
type MissingNavigation = { url: string; pageId: number; received: boolean };
interface RuntimeState {
  origin: string;
  pageIds: Map<Page, number>;
  pending: Set<Request>;
  problems: Problem[];
  console: ConsoleEntry[];
  expected404: MissingNavigation[];
  requests: number;
}

const states = new WeakMap<BrowserContext, RuntimeState>();
const navigation404Message =
  "Failed to load resource: the server responded with a status of 404 (Not Found)";
const hydrationError = /hydrat|did not match|server.render|Minified React error/i;

function stateFor(page: Page): RuntimeState {
  const state = states.get(page.context());
  if (!state) {
    throw new Error("Import test from tests/e2e/fixtures; the runtime guard is required.");
  }
  return state;
}

function diagnosticUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "<non-URL>";
  }
}

function consoleProblems(state: RuntimeState): Problem[] {
  // One exact browser console error may correspond to each observed, explicitly
  // expected main-frame 404 response. No blanket /404/, net:: or React exclusions.
  const available = state.expected404.filter((entry) => entry.received).slice();
  return state.console.flatMap((entry) => {
    const match = available.findIndex(
      (missing) =>
        entry.type === "error" &&
        entry.text === navigation404Message &&
        entry.url === missing.url &&
        entry.pageId === missing.pageId,
    );
    if (match !== -1) {
      available.splice(match, 1);
      return [];
    }
    if (
      entry.type === "error" ||
      hydrationError.test(entry.text) ||
      /\[vite\]|Service Worker registration blocked by Playwright/i.test(entry.text)
    ) {
      return [
        { kind: `console:${entry.type}`, url: diagnosticUrl(entry.url), message: entry.text },
      ];
    }
    return [];
  });
}

function violations(state: RuntimeState): Problem[] {
  return [...state.problems, ...consoleProblems(state)];
}

export const test = base.extend<{
  tenantId: TenantId;
  tenant: { config: TenantConfig; content: TenantContent };
  runtimeGuard: void;
}>({
  tenantId: ["apex-technology", { option: true }],
  serviceWorkers: "block",
  tenant: async ({ tenantId }, provideTenant) => {
    expect(tenantId, "Unknown E2E tenant option").toBe("apex-technology");
    const tenant = await loadTenantData(tenantId);
    expect(tenant.config.id).toBe(tenantId);
    await provideTenant(tenant);
  },
  runtimeGuard: [
    async ({ context, baseURL, serviceWorkers }, provideGuard, testInfo) => {
      expect(serviceWorkers, "Production tests must block service workers").toBe("block");
      if (!baseURL) throw new Error("Each tenant project must supply its production baseURL.");
      const baseUrl = new URL(baseURL);
      expect(baseUrl.protocol).toBe("http:");
      expect(baseUrl.hostname).toBe("127.0.0.1");
      expect(baseUrl.username + baseUrl.password).toBe("");
      const state: RuntimeState = {
        origin: baseUrl.origin,
        pageIds: new Map(),
        pending: new Set(),
        problems: [],
        console: [],
        expected404: [],
        requests: 0,
      };
      states.set(context, state);
      const observePage = (page: Page) => {
        if (state.pageIds.has(page)) return;
        state.pageIds.set(page, state.pageIds.size + 1);
        page.on("pageerror", (error) => {
          state.problems.push({ kind: "pageerror", message: error.stack ?? error.message });
        });
      };
      context.on("page", observePage);
      context.pages().forEach(observePage);
      // Context listeners include popups; do not also collect the same page events.
      context.on("console", (message) => {
        const page = message.page();
        state.console.push({
          type: message.type(),
          text: message.text(),
          url: message.location().url,
          pageId: page ? (state.pageIds.get(page) ?? null) : null,
        });
      });
      context.on("serviceworker", (worker) => {
        state.problems.push({ kind: "serviceworker", url: diagnosticUrl(worker.url()) });
      });
      context.on("request", (request) => {
        state.requests++;
        state.pending.add(request);
      });
      context.on("requestfinished", (request) => state.pending.delete(request));
      context.on("requestfailed", (request) => {
        state.pending.delete(request);
        state.problems.push({
          kind: "requestfailed",
          url: diagnosticUrl(request.url()),
          message: request.failure()?.errorText ?? "Unknown request failure",
        });
      });
      context.on("response", (response) => {
        if (response.status() < 400) return;
        const request = response.request();
        if (response.status() === 404 && request.isNavigationRequest()) {
          const frame = request.frame();
          const missing = state.expected404.find(
            (entry) =>
              !entry.received &&
              entry.url === response.url() &&
              entry.pageId === state.pageIds.get(frame.page()) &&
              frame === frame.page().mainFrame(),
          );
          if (missing) {
            missing.received = true;
            return;
          }
        }
        state.problems.push({
          kind: "badresponse",
          url: diagnosticUrl(response.url()),
          status: response.status(),
        });
      });
      await context.route("**/*", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const local = url.protocol === "http:" && url.origin === state.origin;
        const production = !/^\/(?:@vite\/client|@react-refresh)(?:$|\/)/.test(url.pathname);
        const readOnly = ["GET", "HEAD"].includes(request.method());
        if (!local || !production || !readOnly) {
          state.problems.push({
            kind: !local ? "external-egress" : !production ? "vite-development" : "submission",
            url: diagnosticUrl(request.url()),
            message: request.method(),
          });
          await route.abort("blockedbyclient");
          return;
        }
        await route.continue();
      });
      await context.routeWebSocket("**/*", async (socket) => {
        state.problems.push({ kind: "websocket", url: diagnosticUrl(socket.url()) });
        // Never connectToServer: even a loopback HMR socket is a production failure.
        await socket.close();
      });
      try {
        await provideGuard();
      } finally {
        // Preserve diagnostics even when a test or this asynchronous drain fails.
        try {
          await expect
            .poll(() => state.pending.size, { message: "Outstanding production requests" })
            .toBe(0);
        } finally {
          const problems = violations(state);
          await testInfo.attach("runtime-guard.json", {
            contentType: "application/json",
            body: JSON.stringify(
              {
                project: testInfo.project.name,
                requests: state.requests,
                expected404: state.expected404,
                pending: [...state.pending].map((request) => ({
                  url: diagnosticUrl(request.url()),
                  type: request.resourceType(),
                })),
                console: state.console.map((entry) => ({
                  ...entry,
                  url: diagnosticUrl(entry.url),
                })),
                problems,
              },
              null,
              2,
            ),
          });
          expect(problems, "Production runtime / network guard").toEqual([]);
          expect(
            state.expected404.every((entry) => entry.received),
            "Expected 404 observed",
          ).toBe(true);
        }
        // Keep interception active until Playwright destroys its owned context.
      }
    },
    { auto: true },
  ],
});

/** Ready after either a real navigation or a client-side link action; never a timed sleep. */
export async function waitForReady(page: Page, path: string): Promise<void> {
  const state = stateFor(page);
  const expected = new URL(path, state.origin);
  expect(expected.origin).toBe(state.origin);
  await expect(page).toHaveURL(expected.href);
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main [data-route-path]")).toHaveAttribute(
    "data-route-path",
    expected.pathname,
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  expect(violations(state), "Errors during route readiness / hydration").toEqual([]);
}

export async function gotoReady(page: Page, path: string): Promise<Response> {
  const state = stateFor(page);
  const url = new URL(path, state.origin);
  expect(url.origin).toBe(state.origin);
  const response = await page.goto(url.href, { waitUntil: "load" });
  if (!response) throw new Error(`No navigation response for ${path}`);
  expect(response.status(), `HTTP status for ${path}`).toBe(200);
  await waitForReady(page, path);
  return response;
}

/** Drain actual in-flight assets before leaving a page, without network-idle sleeps. */
export async function waitForRequests(page: Page): Promise<void> {
  const state = stateFor(page);
  await expect.poll(() => state.pending.size).toBe(0);
  expect(violations(state), "Production resource requests").toEqual([]);
}

/** Register BEFORE navigating; resource 404s and unregistered navigation 404s still fail. */
export async function gotoNotFound(page: Page, path: string): Promise<Response> {
  const state = stateFor(page);
  const url = new URL(path, state.origin);
  expect(url.origin).toBe(state.origin);
  const pageId = state.pageIds.get(page);
  if (pageId === undefined) throw new Error("Missing page instrumentation");
  state.expected404.push({ url: url.href, pageId, received: false });
  const response = await page.goto(url.href, { waitUntil: "load" });
  if (!response) throw new Error(`No navigation response for ${path}`);
  expect(response.status(), "Static hosting must return 404, not a blanket SPA 200").toBe(404);
  await expect(page).toHaveURL(url.href);
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByRole("heading", { level: 1, name: /page not found/i })).toBeVisible();
  return response;
}
