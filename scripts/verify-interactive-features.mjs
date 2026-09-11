/* global document, innerWidth -- Assertions execute in installed Chromium. */
/**
 * Offline, actual-dev-server Prompt 12 audit. Run directly with Node from any cwd.
 * No installs, browser downloads, source mutations, live endpoints or external clicks.
 * HTTP(S) and WebSocket egress is intercepted before connection; attempted egress fails.
 * Endpoint success/failure/timeout mocks belong to component tests, not this audit.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "build/interactive-browser");
const reportPath = path.join(root, "build/interactive-browser-audit.json");
const profiles = [
  { name: "desktop", width: 1440, height: 960, reducedMotion: "no-preference" },
  { name: "mobile", width: 360, height: 800, reducedMotion: "no-preference" },
  { name: "mobile-reduced", width: 360, height: 800, reducedMotion: "reduce" },
];
const formPages = {
  contact: ["generalEnquiry", "consultation"],
  conversion: ["conversionEnquiry"],
  newsEvents: ["newsletter"],
};
const sampleValues = {
  name: "Demo Audit Person",
  email: "interactive-audit@example.com",
  phone: "+44 7700 900123",
  message: "Fictional browser validation only. Do not send or store this example.",
  program: "Demonstration programme",
  organisation: "Fictional Audit Organisation",
};
const counterKeys = [
  "checksPassed",
  "checksFailed",
  "routes",
  "forms",
  "disabledForms",
  "newsletterStates",
  "blankValidations",
  "demoValidations",
  "inlineErrors",
  "contactLinks",
  "externalLinks",
  "listingSections",
  "paginationTransitions",
  "categorySelections",
  "downloadGroups",
  "downloads",
  "galleries",
  "disabledGalleries",
  "focusTrapSteps",
  "images",
  "axeRuns",
  "screenshots",
  "requests",
  "webSockets",
  "externalAttempts",
  "blockedSubmissions",
  "failedRequests",
  "consoleErrors",
  "consoleWarnings",
  "pageErrors",
];
const counters = () => Object.fromEntries(counterKeys.map((key) => [key, 0]));
const report = {
  startedAt: new Date().toISOString(),
  finishedAt: null,
  status: "running",
  ok: false,
  counters: counters(),
  limitations: [
    "Development output only; not a build, production, no-JS or live-host verification.",
    "Only current authored flags are inspected; configuration is never toggled or rewritten.",
    "Enabled forms must have no endpoint. No live delivery or success/failure mock is exercised.",
    "Mocked endpoint success/failure, timeout and duplicate submission are component-test concerns.",
    "Axe checks main content and the open gallery dialog, not the entire shared layout.",
    "Image dimensions/lazy attributes and overflow are checked, not a performance/CLS score.",
    "Report persistence cannot survive SIGKILL, power loss or an unwritable output directory.",
  ],
  tenants: [],
  failures: [],
  cleanupErrors: [],
};
let browser;
let vite;
let activeContext;
let activeServer;
let interrupted = false;
let cleanupPromise;
let expect;
let AxeBuilder;
let preservedReport = false;

function message(error) {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

function save() {
  fs.mkdirSync(output, { recursive: true });
  if (!preservedReport) {
    if (fs.existsSync(reportPath))
      fs.copyFileSync(
        reportPath,
        path.join(output, `previous-${Date.now()}.json`),
        fs.constants.COPYFILE_EXCL,
      );
    preservedReport = true;
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function count(tenant, key, amount = 1) {
  tenant.counters[key] += amount;
  report.counters[key] += amount;
}

async function bounded(promise, milliseconds, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out`)), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function availablePort() {
  // A fixed, small allowlist, never a random public interface or an existing server.
  for (let port = 5315; port <= 5324; port++) {
    const available = await new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.once("error", (error) => {
        if (error.code === "EADDRINUSE" || error.code === "EACCES") resolve(false);
        else reject(error);
      });
      probe.listen({ host: "127.0.0.1", port, exclusive: true }, () => {
        probe.close((error) => (error ? reject(error) : resolve(true)));
      });
    });
    if (available) return port;
  }
  throw new Error("No available audit port in 5315–5324; no existing process was stopped.");
}

function launchServer(tenant, port) {
  const origin = `http://127.0.0.1:${port}`;
  const logFile = path.join(output, `${tenant.id}-dev.log`);
  const child = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/@react-router/dev/bin.js"),
      "dev",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: root,
      shell: false,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, BROWSER: "none" },
    },
  );
  const state = { child, origin, closed: false, stopping: false, stopPromise: null };
  tenant.server = {
    origin,
    pid: child.pid,
    log: path.relative(root, logFile).replaceAll("\\", "/"),
  };
  state.exited = new Promise((resolve) =>
    child.once("close", (code, signal) => {
      state.closed = true;
      tenant.server.exit = { code, signal, requested: state.stopping };
      resolve();
    }),
  );
  state.ready = new Promise((resolve, reject) => {
    let raw = "";
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => finish(new Error(`Dev startup timeout: ${tenant.id}`)), 120000);
    const onData = (chunk) => {
      // Strip AFTER concatenation: both URL text and ANSI sequences can cross chunks.
      raw = (raw + chunk.toString()).slice(-131072);
      const text = stripVTControlCharacters(raw);
      try {
        fs.writeFileSync(logFile, text, "utf8");
      } catch (error) {
        finish(error);
        return;
      }
      if (text.includes(origin)) finish();
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", (error) => {
      tenant.server.error = message(error);
      finish(error);
    });
    child.once("close", (code, signal) =>
      finish(new Error(`Dev stopped before ready: ${code}/${signal}`)),
    );
  });
  return state;
}

async function stopServer(state) {
  if (!state) return;
  if (state.stopPromise) return state.stopPromise;
  state.stopping = true;
  state.stopPromise = (async () => {
    if (!state.child.pid) return;
    if (process.platform === "win32") {
      if (!state.closed) {
        // tenant-cli spawns another Node: killing only the wrapper leaks the dev server.
        const killed = spawnSync(
          path.join(process.env.SystemRoot ?? "C:\\Windows", "System32/taskkill.exe"),
          ["/PID", String(state.child.pid), "/T", "/F"],
          { shell: false, encoding: "utf8", timeout: 15000, windowsHide: true },
        );
        if (killed.error) throw killed.error;
        assert.equal(
          killed.status,
          0,
          `Could not terminate owned dev process tree: ${killed.stderr}`,
        );
      }
    } else {
      try {
        process.kill(-state.child.pid, "SIGTERM");
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
    }
    await bounded(state.exited, 15000, "Dev process-tree exit");
  })();
  return state.stopPromise;
}

async function cleanup() {
  if (cleanupPromise) return cleanupPromise;
  cleanupPromise = (async () => {
    for (const [name, close] of [
      ["browser context", () => activeContext?.close()],
      ["tenant dev server", () => stopServer(activeServer)],
      ["Chromium", () => browser?.close()],
      ["configuration Vite", () => vite?.close()],
    ]) {
      try {
        await bounded(Promise.resolve().then(close), 20000, `${name} cleanup`);
      } catch (error) {
        report.cleanupErrors.push({ resource: name, error: message(error) });
      }
    }
  })();
  return cleanupPromise;
}

function interrupt(signal) {
  interrupted = true;
  report.failures.push(`Interrupted by ${signal}`);
  process.exitCode = 1;
  save();
  // Interrupt active waits, but leave global cleanup to finally: a resource acquisition
  // may still be pending and must not land after a memoized cleanup has completed.
  for (const pending of [activeContext?.close(), stopServer(activeServer)]) {
    void pending?.catch((error) =>
      report.cleanupErrors.push({
        resource: `signal ${signal}`,
        error: message(error),
      }),
    );
  }
}
const onInterrupt = () => interrupt("SIGINT");
const onTerminate = () => interrupt("SIGTERM");

function safeUrl(value) {
  try {
    const url = new URL(value);
    // Never persist query/form values, URL credentials or fragments in diagnostics.
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return "[invalid URL]";
  }
}

async function guardNetwork(context, origin, tenant, mode) {
  const diagnostics = { external: [], submissions: [], failed: [], console: [], page: [] };
  mode.diagnostics = diagnostics;
  let recording = true;
  const requests = [];
  const isLocal = (value, websocket = false) => {
    const url = new URL(value);
    return url.host === new URL(origin).host && url.protocol === (websocket ? "ws:" : "http:");
  };
  const external = (url, transport) => {
    diagnostics.external.push({ url: safeUrl(url), transport });
    count(tenant, "externalAttempts");
  };
  context.on("request", (request) => {
    if (!recording) return;
    count(tenant, "requests");
    requests.push({
      type: request.resourceType(),
      method: request.method(),
      url: safeUrl(request.url()),
    });
  });
  context.on("requestfailed", (request) => {
    if (!recording) return;
    diagnostics.failed.push({ url: safeUrl(request.url()), error: request.failure()?.errorText });
    count(tenant, "failedRequests");
  });
  context.on("page", (page) => {
    page.on("pageerror", (error) => {
      if (!recording) return;
      diagnostics.page.push(message(error));
      count(tenant, "pageErrors");
    });
    page.on("console", (entry) => {
      if (!recording) return;
      if (entry.type() !== "error" && entry.type() !== "warning") return;
      if (
        mode.reducedMotion === "reduce" &&
        entry.type() === "warning" &&
        entry
          .text()
          .startsWith(
            "You have Reduced Motion enabled on your device. Animations may not appear as expected.",
          )
      )
        return;
      diagnostics.console.push({ type: entry.type(), text: entry.text() });
      count(tenant, entry.type() === "error" ? "consoleErrors" : "consoleWarnings");
    });
  });
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (!isLocal(request.url())) {
      external(request.url(), request.resourceType());
      await route.abort("blockedbyclient");
    } else if (!["GET", "HEAD"].includes(request.method())) {
      diagnostics.submissions.push({ method: request.method(), url: safeUrl(request.url()) });
      count(tenant, "blockedSubmissions");
      await route.abort("blockedbyclient");
    } else {
      await route.continue();
    }
  });
  assert.equal(
    typeof context.routeWebSocket,
    "function",
    "Installed Playwright must support WebSocket interception",
  );
  await context.routeWebSocket("**/*", (socket) => {
    if (isLocal(socket.url(), true)) {
      count(tenant, "webSockets");
      socket.connectToServer(); // Actual local Vite HMR is allowed, not a socket mock.
    } else {
      external(socket.url(), "websocket");
      socket.close();
    }
  });
  return {
    requests,
    stopRecording() {
      recording = false;
    },
    assertClean() {
      for (const [kind, entries] of Object.entries(diagnostics)) {
        assert.deepEqual(entries, [], `${tenant.id}/${mode.name}: ${kind}`);
      }
    },
  };
}

async function step(tenant, route, name, run) {
  const check = { name, ok: false };
  route.checks.push(check);
  try {
    if (interrupted) throw new Error("Audit interrupted");
    await run();
    check.ok = true;
    count(tenant, "checksPassed");
    return true;
  } catch (error) {
    check.error = message(error);
    count(tenant, "checksFailed");
    console.error(`FAIL ${tenant.id}/${route.pageId}/${name}: ${error.message ?? error}`);
    return false;
  }
}

async function screenshot(page, tenant, mode, suffix, locator = page) {
  const filename = `${tenant.id}-${mode.name}-${suffix}.png`;
  await locator.screenshot({ path: path.join(output, filename) });
  mode.screenshots.push(`build/interactive-browser/${filename}`);
  count(tenant, "screenshots");
}

async function overflow(page) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    "Horizontal overflow",
  );
}

async function accessibility(page, tenant, selector = "main") {
  const result = await new AxeBuilder({ page }).include(selector).analyze();
  count(tenant, "axeRuns");
  assert.deepEqual(
    result.violations
      .filter((violation) => ["serious", "critical"].includes(violation.impact))
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.map((node) => node.target),
      })),
    [],
    `${selector}: serious/critical axe violations`,
  );
}

async function media(page, tenant, scope = page.locator("main")) {
  const images = scope.locator("img");
  for (const image of await images.all()) {
    assert(Number(await image.getAttribute("width")) > 0, "Image needs intrinsic width");
    assert(Number(await image.getAttribute("height")) > 0, "Image needs intrinsic height");
    assert.notEqual(await image.getAttribute("alt"), null, "Image needs deliberate alt text");
    const priority = (await image.getAttribute("fetchpriority")) === "high";
    await expect(image).toHaveAttribute("loading", priority ? "eager" : "lazy");
    count(tenant, "images");
    // Never unhide off-page cards or replace lazy loading with eager attributes.
    if (await image.isVisible()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((node) => node.complete && node.naturalWidth > 0), {
          message: "Visible local image must decode",
          timeout: 15000,
        })
        .toBe(true);
    }
  }
  await page.evaluate(() => document.fonts.ready);
  await overflow(page);
}

async function externalLinkRels(page, tenant) {
  for (const link of await page.locator("a[href]").all()) {
    const href = await link.getAttribute("href");
    if (!/^https?:\/\//.test(href)) continue;
    if (new URL(href).origin === new URL(page.url()).origin) continue;
    const rel = ((await link.getAttribute("rel")) ?? "").split(/\s+/);
    assert(
      rel.includes("noopener") && rel.includes("noreferrer"),
      `Unsafe external link: ${safeUrl(href)}`,
    );
    count(tenant, "externalLinks");
  }
}

async function contactLinks(page, tenant, config) {
  const scope = page.locator('main [data-section-type="contactDetails"]');
  await expect(scope).toHaveCount(1);
  const expected = [
    `mailto:${config.contact.email}`,
    `tel:${config.contact.phone.replace(/[^+\d]/g, "")}`,
    ...(config.contact.whatsapp
      ? [`https://wa.me/${config.contact.whatsapp.replace(/\D/g, "")}`]
      : []),
    ...(config.contact.directionsUrl ? [config.contact.directionsUrl] : []),
    ...config.integrations.portals.map((portal) => portal.href),
  ];
  for (const href of expected) {
    const link = scope.locator(`a[href=${JSON.stringify(href)}]`);
    await expect(link).toHaveCount(1);
    await expect(link).toBeVisible();
    count(tenant, "contactLinks");
  }
  // All are inspected only. No telephone, mail, map, portal or WhatsApp is opened.
}

async function exerciseForm(page, tenant, mode, form, settings, formId, network) {
  assert(!settings.endpoint, "Refusing to validate a form with a configured endpoint");
  const submit = form.locator('button[type="submit"]');
  await expect(submit).toBeEnabled(); // Hydration must remove the native disabled fieldset.
  const startRequest = network.requests.length;
  const location = page.url();
  await submit.click();
  const summary = form.locator('[role="alert"][tabindex="-1"]');
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  const needsConsent = settings.consentEnabled ?? Boolean(settings.consentText?.trim());
  const required = [...settings.requiredFields, ...(needsConsent ? ["consent"] : [])].sort();
  const invalid = form.locator('[aria-invalid="true"]');
  assert.deepEqual(
    (await invalid.evaluateAll((nodes) => nodes.map((node) => node.name))).sort(),
    required,
    `${formId}: invalid controls must match configured requirements`,
  );
  await expect(summary.getByRole("link")).toHaveCount(required.length);
  for (const control of await invalid.all()) {
    const controlId = await control.getAttribute("id");
    assert(controlId, "Invalid field needs an ID");
    const described = ((await control.getAttribute("aria-describedby")) ?? "")
      .split(/\s+/)
      .filter(Boolean);
    assert(described.length > 0, "Invalid field must describe its inline error");
    let errorText = false;
    for (const id of described) {
      const error = form.locator(`[id=${JSON.stringify(id)}]`);
      await expect(error).toBeVisible();
      if ((await error.innerText()).trim()) errorText = true;
    }
    assert(errorText, "Inline error must contain text");
    await expect(summary.locator(`a[href=${JSON.stringify(`#${controlId}`)}]`)).toHaveCount(1);
    count(tenant, "inlineErrors");
  }
  await screenshot(page, tenant, mode, `${formId}-errors`, form);
  await accessibility(page, tenant);
  await overflow(page);
  count(tenant, "blankValidations");
  const firstErrorLink = summary.getByRole("link").first();
  const target = (await firstErrorLink.getAttribute("href")).slice(1);
  await firstErrorLink.focus();
  await page.keyboard.press("Enter");
  await expect(form.locator(`[id=${JSON.stringify(target)}]`)).toBeFocused();
  for (const control of await form.locator("input[name], textarea[name]").all()) {
    const name = await control.getAttribute("name");
    if (name === "website") {
      await expect(control).toBeHidden();
      await expect(control).toHaveValue("");
      continue;
    }
    if (name === "consent") continue;
    assert(Object.hasOwn(sampleValues, name), `No fictional fixture for field ${name}`);
    await control.fill(sampleValues[name]);
  }
  const consent = form.locator('input[name="consent"]');
  await expect(consent).toHaveCount(needsConsent ? 1 : 0);
  if (needsConsent) {
    await expect(consent).toBeVisible();
    await consent.check();
  }
  await submit.click();
  const status = form.getByRole("status");
  await expect(status).toHaveText(/demonstration only\. nothing was submitted to a server\./i);
  await expect(summary).toHaveCount(0);
  await expect(invalid).toHaveCount(0);
  await expect(submit).toBeEnabled();
  assert(
    !(await status.innerText()).includes(settings.successMessage),
    "Demo must not claim endpoint success",
  );
  await page.waitForLoadState("networkidle");
  assert.equal(page.url(), location, "Validation must not navigate or serialize values into a URL");
  const calls = network.requests
    .slice(startRequest)
    .filter(
      (request) =>
        ["fetch", "xhr", "ping", "document"].includes(request.type) ||
        !["GET", "HEAD"].includes(request.method),
    );
  assert.deepEqual(
    calls,
    [],
    "Blank and valid demo attempts must issue zero submission/fetch/XHR/beacon calls",
  );
  network.assertClean();
  count(tenant, "forms");
  count(tenant, "demoValidations");
}

async function forms(page, tenant, mode, pageId, config, content, network) {
  const ids = formPages[pageId] ?? [];
  const templates = content.pageSections?.[pageId] ?? [];
  let enabledCount = 0;
  for (const id of ids) {
    const settings = config.integrations.forms[id];
    const template = templates.find((section) => section.formId === id);
    assert(template, `Missing authored ${pageId}/${id} form section`);
    const enabled = settings.enabled && (id !== "newsletter" || config.features.newsletterSignup);
    const form = page.getByRole("form", { name: template.heading, exact: true });
    await expect(form).toHaveCount(enabled ? 1 : 0);
    if (id === "newsletter") {
      await expect(page.locator('main [data-section-type="newsletter"]')).toHaveCount(
        enabled ? 1 : 0,
      );
      count(tenant, "newsletterStates");
    }
    if (!enabled) {
      count(tenant, "disabledForms");
      continue;
    }
    enabledCount++;
    assert.notEqual(template.enabled, false, `Enabled form ${id} must be composed into its page`);
    await exerciseForm(page, tenant, mode, form, settings, id, network);
    const fallbacks = [
      `mailto:${config.contact.email}`,
      `tel:${config.contact.phone.replace(/[^+\d]/g, "")}`,
      ...(config.contact.whatsapp
        ? [`https://wa.me/${config.contact.whatsapp.replace(/\D/g, "")}`]
        : []),
      ...(settings.externalFormUrl ? [settings.externalFormUrl] : []),
    ];
    for (const href of fallbacks)
      await expect(form.locator(`a[href=${JSON.stringify(href)}]`)).toBeVisible();
  }
  await expect(page.locator("main form")).toHaveCount(enabledCount);
}

async function listing(page, tenant, section, settings, records, seen) {
  assert(settings, "Listing must have authored pagination settings");
  const results = section.locator('ul[tabindex="-1"][aria-describedby]');
  await expect(results).toHaveCount(1);
  const label = (await results.getAttribute("aria-label")).replace(/ results$/, "");
  const status = section.locator(
    `[id=${JSON.stringify(await results.getAttribute("aria-describedby"))}]`,
  );
  const cards = results.locator(":scope > li");
  const visible = results.locator(":scope > li:visible");
  const titles = await cards.evaluateAll((nodes) =>
    nodes.map((node) => node.querySelector("h2,h3,h4,h5")?.textContent?.trim()),
  );
  const byTitle = new Map(records.map((item) => [item.title, item]));
  assert.equal(
    byTitle.size,
    records.length,
    "Audit requires unambiguous authored collection titles",
  );
  const items = titles.map((title) => {
    assert(byTitle.has(title), `Unknown rendered ${label} card: ${title}`);
    const record = byTitle.get(title);
    seen.push(record.slug);
    return record;
  });
  const pageSize = settings.pageSize;
  const nav = section.getByRole("navigation", { name: `${label} pagination`, exact: true });
  const select = section.getByRole("combobox");
  const unchangedUrl = page.url();
  async function state(filtered, pageNumber, category = "") {
    const total = filtered.length;
    const start = (pageNumber - 1) * pageSize;
    const expected = filtered.slice(start, start + pageSize).map((item) => item.title);
    await expect(visible).toHaveCount(expected.length);
    assert.deepEqual(
      await visible.evaluateAll((nodes) =>
        nodes.map((node) => node.querySelector("h2,h3,h4,h5")?.textContent?.trim()),
      ),
      expected,
    );
    await expect(cards).toHaveCount(items.length); // Hidden HTML is retained, not deleted.
    await expect(results.locator(":scope > li[hidden]")).toHaveCount(
      items.length - expected.length,
    );
    await expect(results.getByRole("article")).toHaveCount(expected.length); // Accessibility tree too.
    await expect(status).toContainText(
      `Showing ${total ? start + 1 : 0}–${Math.min(start + pageSize, total)} of ${total} results.`,
    );
    if (total)
      await expect(status).toContainText(`Page ${pageNumber} of ${Math.ceil(total / pageSize)}.`);
    if (category) await expect(status).toContainText(`Category: ${category}.`);
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(nav).toHaveCount(total > pageSize ? 1 : 0);
    assert.equal(
      page.url(),
      unchangedUrl,
      "Pagination/filtering must preserve the canonical location",
    );
  }
  await state(items, 1);
  if (items.length > pageSize) {
    const pageTwo = nav.getByRole("button", { name: "2", exact: true });
    await expect(nav.getByRole("link")).toHaveCount(0);
    await pageTwo.focus();
    await page.keyboard.press("Enter");
    await expect(results).toBeFocused();
    await state(items, 2);
    await media(page, tenant, section);
    count(tenant, "paginationTransitions");
  }
  await expect(select).toHaveCount(settings.categoryFiltering && items.length ? 1 : 0);
  if (settings.categoryFiltering && items.length) {
    await expect(select).toHaveAccessibleName(`Filter ${label} by category`);
    await expect(select).toHaveAttribute("aria-controls", await results.getAttribute("id"));
    const categories = [...new Set(items.map((item) => item.category ?? "Uncategorized"))].sort(
      (a, b) => a.localeCompare(b),
    );
    assert.deepEqual(
      await select
        .locator("option")
        .evaluateAll((options) => options.map((option) => option.value)),
      ["", ...categories],
    );
    for (const category of categories) {
      await select.focus();
      await select.selectOption(category);
      await expect(select).toBeFocused();
      await state(
        items.filter((item) => (item.category ?? "Uncategorized") === category),
        1,
        category,
      );
      count(tenant, "categorySelections");
    }
    await select.selectOption("");
    await state(items, 1);
  } else if (items.length > pageSize) {
    await nav.getByRole("button", { name: "1", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(results).toBeFocused();
    await state(items, 1);
  }
  count(tenant, "listingSections");
  return items.length > pageSize;
}

async function listings(page, tenant, config, content) {
  for (const [kind, type] of [
    ["news", "newsGrid"],
    ["events", "eventsGrid"],
  ]) {
    const records = config.contentSources[kind] === "local" ? content[kind] : [];
    const sections = page.locator(`main [data-section-type=${JSON.stringify(type)}]`);
    assert((await sections.count()) > 0, `Missing ${kind} sections`);
    const seen = [];
    let pageTwoChecks = 0;
    for (const section of await sections.all()) {
      if (await listing(page, tenant, section, config.listings[kind], records, seen))
        pageTwoChecks++;
    }
    assert.deepEqual(
      [...seen].sort(),
      records.map((item) => item.slug).sort(),
      `${kind}: no missing or duplicate cards across date groups`,
    );
    if (records.length > config.listings[kind].pageSize * (await sections.count())) {
      assert(pageTwoChecks > 0, `${kind}: page 2 was not exercised`);
    }
  }
}

async function downloads(page, tenant, config, content) {
  const section = page.locator('main [data-section-type="downloads"]');
  await expect(section).toHaveCount(1);
  const records = config.contentSources.downloads === "local" ? content.downloads : [];
  const categories = [...new Set(records.map((item) => item.category ?? "Other resources"))];
  await expect(section.locator("section[aria-label]")).toHaveCount(categories.length);
  for (const category of categories) {
    const group = section.getByRole("region", { name: category, exact: true });
    await expect(group.getByRole("heading", { name: category, exact: true })).toBeVisible();
    const items = records.filter((item) => (item.category ?? "Other resources") === category);
    await expect(group.getByRole("article")).toHaveCount(items.length);
    count(tenant, "downloadGroups");
    for (const item of items) {
      const card = group.getByRole("article", { name: item.title, exact: true });
      const link = card.getByRole("link", { name: `Download ${item.title}`, exact: true });
      const href = await link.getAttribute("href");
      assert.equal(
        new URL(href, page.url()).origin,
        new URL(page.url()).origin,
        "Downloads must be local",
      );
      const base = new URL(config.siteUrl).pathname.replace(/\/$/, "");
      assert.equal(new URL(href, page.url()).pathname, `${base}${item.file}`);
      await expect(link).toHaveAttribute("download", "");
      assert(await link.getAttribute("type"), "Download must declare a MIME type");
      const details = card.locator(
        `[id=${JSON.stringify(await link.getAttribute("aria-describedby"))}]`,
      );
      await expect(details).toContainText(item.fileType.toUpperCase());
      await expect(details).toContainText(
        `${new Intl.NumberFormat("en-GB", { maximumSignificantDigits: 4 }).format(item.fileSizeKb)} KB`,
      );
      const file = path.resolve(root, "public", `.${item.file}`);
      assert(file.startsWith(path.join(root, "public") + path.sep), "Download escaped public root");
      assert(fs.statSync(file).size > 0, "Download file is empty");
      count(tenant, "downloads");
    }
  }
}

async function gallery(page, tenant, mode, config, content) {
  const section = page.locator('main [data-section-type="imageGallery"]');
  await expect(section).toHaveCount(1);
  const records = config.contentSources.gallery === "local" ? content.gallery : [];
  assert(records.length >= 2, "Gallery keyboard check requires two authored images");
  const captions = records.map(
    (item) => `${item.album}${item.caption ? ` — ${item.caption}` : ""}`,
  );
  await expect(section.locator("figure")).toHaveCount(records.length);
  await expect(section.locator("figcaption")).toHaveText(captions);
  const trigger = section.getByRole("button", { name: `View image: ${captions[0]}`, exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog).toHaveAccessibleName(captions[0]);
  await expect
    .poll(() => dialog.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true);
  const buttons = dialog.getByRole("button");
  assert((await buttons.count()) >= 3, "Gallery needs close, previous and next controls");
  // Start at each boundary and deliberately wrap in both directions, then keep cycling.
  for (const [key, edge] of [
    ["Tab", buttons.last()],
    ["Shift+Tab", buttons.first()],
  ]) {
    await edge.focus();
    for (let index = 0; index < (await buttons.count()) + 2; index++) {
      await page.keyboard.press(key);
      assert(
        await dialog.evaluate((node) => node.contains(document.activeElement)),
        `${key} escaped gallery focus trap`,
      );
      count(tenant, "focusTrapSteps");
    }
  }
  await page.keyboard.press("ArrowRight");
  await expect(dialog).toHaveAccessibleName(captions[1]);
  await expect(dialog).toHaveAccessibleDescription(`Image 2 of ${records.length}`);
  await page.keyboard.press("ArrowLeft");
  await expect(dialog).toHaveAccessibleName(captions[0]);
  await expect(dialog).toHaveAccessibleDescription(`Image 1 of ${records.length}`);
  await media(page, tenant, dialog);
  await accessibility(page, tenant, '[role="dialog"]');
  await screenshot(page, tenant, mode, "gallery");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused(); // Includes delayed focus restoration after real motion.
  await overflow(page);
  count(tenant, "galleries");
}

async function auditProfile(tenant, config, content, profile, origin) {
  const mode = { ...profile, ok: false, routes: [], screenshots: [] };
  tenant.profiles.push(mode);
  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    reducedMotion: profile.reducedMotion,
    serviceWorkers: "block",
    acceptDownloads: false,
    locale: "en-GB",
  });
  activeContext = context;
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(60000);
  let network;
  try {
    assert(!interrupted, "Audit interrupted");
    network = await guardNetwork(context, origin, tenant, mode);
    const page = await context.newPage();
    const base = new URL(config.siteUrl).pathname.replace(/\/$/, "");
    for (const pageId of ["contact", "conversion", "newsEvents", "downloads", "gallery"]) {
      if (interrupted) break;
      const entry = config.pages[pageId];
      const result = { pageId, path: `${base}${entry.path}`, ok: false, checks: [] };
      mode.routes.push(result);
      if (!entry.enabled) {
        result.skipped = "Disabled by current tenant configuration";
        if (pageId === "gallery") {
          await step(tenant, result, "disabled gallery is not linked or enhanced", async () => {
            await expect(page.locator('main [data-section-type="imageGallery"]')).toHaveCount(0);
            await expect(page.locator(`a[href=${JSON.stringify(result.path)}]`)).toHaveCount(0);
            count(tenant, "disabledGalleries");
          });
        }
        result.ok = result.checks.every((check) => check.ok);
        save();
        continue;
      }
      const loaded = await step(tenant, result, "load actual configured dev route", async () => {
        assert(!activeServer.closed, "Owned dev server stopped unexpectedly");
        const response = await page.goto(`${origin}${result.path}`, { waitUntil: "networkidle" });
        assert(response?.ok(), `Route response was ${response?.status()}`);
        await expect(page.locator("main h1")).toHaveCount(1);
        await expect(page.locator("main h1")).toBeVisible();
        count(tenant, "routes");
      });
      if (loaded) {
        await step(tenant, result, "intrinsic/lazy media, overflow and main axe", async () => {
          await media(page, tenant);
          await accessibility(page, tenant);
        });
        if (formPages[pageId])
          await step(tenant, result, "configured forms, errors and no-send demo", () =>
            forms(page, tenant, mode, pageId, config, content, network),
          );
        if (pageId === "contact")
          await step(tenant, result, "configured contact links", () =>
            contactLinks(page, tenant, config),
          );
        if (pageId === "newsEvents")
          await step(tenant, result, "pagination and configured category filters", () =>
            listings(page, tenant, config, content),
          );
        if (pageId === "downloads")
          await step(tenant, result, "grouped accessible downloads", () =>
            downloads(page, tenant, config, content),
          );
        if (pageId === "gallery")
          await step(tenant, result, "actual gallery focus, arrows and Escape", () =>
            gallery(page, tenant, mode, config, content),
          );
        await step(
          tenant,
          result,
          "external link rels and strict runtime/network diagnostics",
          async () => {
            await externalLinkRels(page, tenant);
            await page.waitForLoadState("networkidle");
            network.assertClean();
            await overflow(page);
          },
        );
      }
      result.ok = result.checks.every((check) => check.ok);
      save();
    }
    network.assertClean();
    mode.ok = !interrupted && mode.routes.length === 5 && mode.routes.every((route) => route.ok);
  } catch (error) {
    mode.error = message(error);
  } finally {
    // Evaluate listeners through all assertions. Only intentional context teardown is excluded.
    network?.stopRecording();
    try {
      await context.close();
    } catch (error) {
      mode.ok = false;
      mode.cleanupError = message(error);
    }
    if (activeContext === context) activeContext = undefined;
    save();
  }
}

process.once("SIGINT", onInterrupt);
process.once("SIGTERM", onTerminate);
try {
  save(); // Persist a running record even if dependency import or Chromium launch fails.
  const playwright = await import("@playwright/test");
  expect = playwright.expect;
  AxeBuilder = (await import("@axe-core/playwright")).default;
  const { createServer } = await import("vite");
  assert(!interrupted, "Audit interrupted");
  vite = await createServer({
    root,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { "@": path.join(root, "src") } },
  });
  assert(!interrupted, "Audit interrupted");
  const { rawConfig: config } = await vite.ssrLoadModule("/src/site/config.ts");
  const { rawContent: content } = await vite.ssrLoadModule("/src/site/content/index.ts");
  const tenant = { id: config.id, ok: false, counters: counters(), profiles: [] };
  report.tenants.push(tenant);
  const executablePath = playwright.chromium.executablePath();
  assert(
    fs.existsSync(executablePath),
    "Installed Chromium is missing; no browser download will be attempted",
  );
  browser = await playwright.chromium.launch({
    headless: true,
    executablePath,
    args: ["--disable-background-networking"],
  });
  assert(!interrupted, "Audit interrupted");
  for (const tenant of report.tenants) {
    if (interrupted) break;
    try {
      assert(!interrupted, "Audit interrupted");
      tenant.configuration = {
        newsletterSignup: config.features.newsletterSignup,
        galleryEnabled: config.pages.gallery.enabled,
        forms: Object.fromEntries(
          Object.entries(config.integrations.forms).map(([id, settings]) => [
            id,
            { enabled: settings.enabled, endpointConfigured: Boolean(settings.endpoint) },
          ]),
        ),
        listings: config.listings,
      };
      assert(
        Object.values(config.integrations.forms).every((settings) => !settings.endpoint),
        "Demo audit refuses configured submission endpoints, including disabled forms",
      );
      const port = await availablePort();
      assert(!interrupted, "Audit interrupted");
      activeServer = launchServer(tenant, port);
      await activeServer.ready;
      for (const profile of profiles) {
        if (interrupted) break;
        await auditProfile(tenant, config, content, profile, activeServer.origin);
      }
      assert(!activeServer.closed, "Owned dev server exited during the audit");
      tenant.ok =
        !interrupted &&
        tenant.profiles.length === profiles.length &&
        tenant.profiles.every((profile) => profile.ok);
    } catch (error) {
      tenant.error = message(error);
      console.error(`FAIL ${tenant.id}: ${error.message ?? error}`);
    } finally {
      try {
        await stopServer(activeServer);
      } catch (error) {
        tenant.ok = false;
        tenant.cleanupError = message(error);
        report.cleanupErrors.push({ resource: tenant.id, error: message(error) });
      }
      activeServer = undefined;
      save();
    }
    console.log(
      `${tenant.ok ? "PASS" : "FAIL"} ${tenant.id}: ${tenant.counters.routes} routes, ${tenant.counters.forms} demo forms, ${tenant.counters.galleries} gallery checks`,
    );
    // Do not launch another tenant while an owned process tree might still be alive.
    if (tenant.cleanupError) break;
  }
} catch (error) {
  report.failures.push(message(error));
  console.error(error.message ?? error);
} finally {
  await cleanup();
  report.finishedAt = new Date().toISOString();
  report.ok =
    !interrupted &&
    report.failures.length === 0 &&
    report.cleanupErrors.length === 0 &&
    report.tenants.length === 1 &&
    report.tenants.every((tenant) => tenant.ok);
  report.status = report.ok ? "passed" : "failed";
  process.exitCode = report.ok ? 0 : 1;
  save();
  process.removeListener("SIGINT", onInterrupt);
  process.removeListener("SIGTERM", onTerminate);
  console.log(
    `INTERACTIVE_BROWSER_AUDIT_EXIT=${process.exitCode}: ${report.counters.checksPassed} passed checks, ${report.counters.checksFailed} failed checks; ${path.relative(root, reportPath)}`,
  );
}
