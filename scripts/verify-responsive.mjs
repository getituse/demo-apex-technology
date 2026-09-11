#!/usr/bin/env node
/* global document, window, getComputedStyle, requestAnimationFrame, CSS, innerHeight -- Callbacks execute in installed Chromium. */
/**
 * Offline responsive audit of the already-built static output:
 *   node scripts/verify-responsive.mjs [--tenant=id]
 *
 * Does not build, install, download a browser, mutate sources or contact any live host.
 * Each tenant's dist/<id> is served by the installed Vite preview CLI on 127.0.0.1,
 * started and stopped one tenant at a time. All non-loopback HTTP and WebSocket egress
 * is intercepted before connection, and any attempt is recorded as a failure.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "build/responsive");
const reportPath = path.join(root, "build/responsive-audit.json");

/** Widths under test. Height follows the width so narrow runs stay phone-shaped. */
const WIDTHS = [360, 375, 390, 768, 1024, 1280, 1440];
/** Tailwind `lg:`. Below it the drawer trigger is the navigation; at or above it the bar is. */
const NAV_BREAKPOINT = 1024;
/** Representative enabled pages. Detail routes, aliases and 404 are out of scope. */
const ROUTE_PAGE_IDS = [
  "home",
  "about",
  "programs",
  "conversion",
  "newsEvents",
  "contact",
  "downloads",
  "gallery",
];
const ZOOM_PAGE_IDS = ["home", "contact"];
/** 200% zoom is emulated by halving these CSS viewports at deviceScaleFactor 2. */
const ZOOM_WIDTHS = [768, 1280];
/** 200% root font size is applied at these viewports. */
const TEXT_SCALE_WIDTHS = [360, 1280];
const SCREENSHOT_WIDTHS = [360, 1440];
const SCREENSHOT_PAGE_ID = "home";

const MIN_FONT_SIZE = 14;
const MIN_LABEL_FONT_SIZE = 12;
const MIN_CONTROL_SIZE = 44;
const MIN_LABELLED_CONTROL_SIZE = 24;
const MIN_CARD_WIDTH = 200;
const MIN_HEADING_SIZE = 20;
/** Subpixel rounding only. Never widen this to make a page pass. */
const TOLERANCE = 1;

const counterKeys = [
  "tenants",
  "routes",
  "widths",
  "viewportChecks",
  "checksPassed",
  "checksFailed",
  "zoomChecks",
  "textScaleChecks",
  "controls",
  "cards",
  "images",
  "tables",
  "footers",
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
  widths: WIDTHS,
  thresholds: {
    minFontSize: MIN_FONT_SIZE,
    minLabelFontSize: MIN_LABEL_FONT_SIZE,
    minControlSize: MIN_CONTROL_SIZE,
    minLabelledControlSize: MIN_LABELLED_CONTROL_SIZE,
    minCardWidth: MIN_CARD_WIDTH,
    minHeadingSize: MIN_HEADING_SIZE,
    tolerance: TOLERANCE,
    navBreakpoint: NAV_BREAKPOINT,
  },
  counters: counters(),
  limitations: [
    "Audits existing dist/<id> output only: no build, install, browser download or live host.",
    "Chromium only. No Firefox, WebKit, real device, touch gesture or screen-reader verification.",
    "200% zoom is emulated by halving the CSS viewport at deviceScaleFactor 2, not browser zoom UI.",
    "Text scaling sets a 200% root font size; OS font settings and user stylesheets are untested.",
    "Geometry is measured after fonts settle and a fixed motion delay; no CLS or performance score.",
    "Icon-only controls are held to 44x44 CSS px; labelled controls to the WCAG 2.2 AA 24x24 minimum. Links inline in a sentence are exempt.",
    "That target-size rule is stricter than WCAG 2.2 AA, which allows 24x24 and inline exceptions.",
    "Prose is held to 14px; incidental UI labels and badges are held to 12px, which is small print rather than unreadable.",
    "Overlap detection skips controls under a fixed or sticky ancestor, which overlay by design.",
    "Only the listed enabled pages are visited; detail routes, aliases and 404 are out of scope.",
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
  // A fixed, small allowlist on loopback only, never a random port or an existing server.
  for (let port = 5431; port <= 5440; port++) {
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
  throw new Error("No available audit port in 5431-5440; no existing process was stopped.");
}

/** Same invocation the Playwright configuration uses: current Node, installed Vite CLI. */
function launchPreview(tenant, port) {
  const origin = `http://127.0.0.1:${port}`;
  const logFile = path.join(output, `${tenant.id}-preview.log`);
  const child = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/vite/bin/vite.js"),
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
      "--outDir",
      "dist",
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
    const timer = setTimeout(
      () => finish(new Error(`Preview startup timeout: ${tenant.id}`)),
      120000,
    );
    const onData = (chunk) => {
      // Strip AFTER concatenation: URL text and ANSI sequences can both cross chunks.
      raw = (raw + chunk.toString()).slice(-131072);
      const text = stripVTControlCharacters(raw);
      try {
        fs.writeFileSync(logFile, text, "utf8");
      } catch (error) {
        finish(error);
        return;
      }
      if (text.includes(`127.0.0.1:${port}`)) finish();
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", (error) => {
      tenant.server.error = message(error);
      finish(error);
    });
    child.once("close", (code, signal) =>
      finish(new Error(`Preview stopped before ready: ${code}/${signal}`)),
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
        const killed = spawnSync(
          path.join(process.env.SystemRoot ?? "C:\\Windows", "System32/taskkill.exe"),
          ["/PID", String(state.child.pid), "/T", "/F"],
          { shell: false, encoding: "utf8", timeout: 15000, windowsHide: true },
        );
        if (killed.error) throw killed.error;
        assert.equal(killed.status, 0, `Could not terminate owned preview: ${killed.stderr}`);
      }
    } else {
      try {
        process.kill(-state.child.pid, "SIGTERM");
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
    }
    await bounded(state.exited, 15000, "Preview process-tree exit");
  })();
  return state.stopPromise;
}

async function cleanup() {
  if (cleanupPromise) return cleanupPromise;
  cleanupPromise = (async () => {
    for (const [name, close] of [
      ["browser context", () => activeContext?.close()],
      ["tenant preview server", () => stopServer(activeServer)],
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
  // Interrupt active waits only; global teardown stays in finally so a pending
  // acquisition cannot land after a memoized cleanup has already completed.
  for (const pending of [activeContext?.close(), stopServer(activeServer)]) {
    void pending?.catch((error) =>
      report.cleanupErrors.push({ resource: `signal ${signal}`, error: message(error) }),
    );
  }
}
const onInterrupt = () => interrupt("SIGINT");
const onTerminate = () => interrupt("SIGTERM");

function safeUrl(value) {
  try {
    const url = new URL(value);
    // Never persist query values, URL credentials or fragments in diagnostics.
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return "[invalid URL]";
  }
}

async function guardNetwork(context, origin, tenant, scope) {
  const diagnostics = { external: [], submissions: [], failed: [], console: [], page: [] };
  scope.diagnostics = diagnostics;
  let recording = true;
  const isLocal = (value, websocket = false) => {
    const url = new URL(value);
    return url.host === new URL(origin).host && url.protocol === (websocket ? "ws:" : "http:");
  };
  const external = (url, transport) => {
    diagnostics.external.push({ url: safeUrl(url), transport });
    count(tenant, "externalAttempts");
  };
  context.on("request", () => {
    if (recording) count(tenant, "requests");
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
      if (entry.type() === "warning") {
        count(tenant, "consoleWarnings");
        scope.warnings.push(entry.text());
        return;
      }
      if (entry.type() !== "error") return;
      diagnostics.console.push(entry.text());
      count(tenant, "consoleErrors");
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
      socket.connectToServer();
    } else {
      external(socket.url(), "websocket");
      socket.close();
    }
  });
  return {
    stopRecording() {
      recording = false;
    },
    assertClean() {
      for (const [kind, entries] of Object.entries(diagnostics)) {
        assert.deepEqual(entries, [], `${tenant.id}/${scope.name}: ${kind}`);
      }
    },
  };
}

function check(tenant, record, name, run) {
  const entry = { name, ok: false };
  record.checks.push(entry);
  try {
    if (interrupted) throw new Error("Audit interrupted");
    run();
    entry.ok = true;
    count(tenant, "checksPassed");
    return true;
  } catch (error) {
    entry.error = message(error);
    count(tenant, "checksFailed");
    console.error(`FAIL ${tenant.id}/${record.label}/${name}: ${error.message ?? error}`);
    return false;
  }
}

/**
 * Runs inside Chromium. Self-contained: it may not close over anything in this module.
 * Measures the live rendered page; it never unhides, rescales or restyles content.
 */
function collectPageFacts(options) {
  const {
    brandName,
    minFontSize,
    minLabelFontSize,
    minControlSize,
    minLabelledControlSize,
    minCardWidth,
    tolerance,
    limit,
  } = options;
  const doc = document;
  const viewport = doc.documentElement.clientWidth;
  const describe = (element) => ({
    tag: element.tagName.toLowerCase(),
    id: element.id || undefined,
    class: typeof element.className === "string" ? element.className.slice(0, 120) : undefined,
    text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60),
  });
  const box = (element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  };
  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    // A 1px box is a visually hidden control, not something a user can see or hit.
    if (rect.width <= 1 || rect.height <= 1) return false;
    if (typeof element.checkVisibility === "function")
      return element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const style = getComputedStyle(element);
    return (
      style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0.01
    );
  };
  const pinned = (element) => {
    for (let node = element; node && node !== doc.documentElement; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === "fixed" || position === "sticky") return true;
    }
    return false;
  };
  const labelled = (element) => {
    if ((element.getAttribute("aria-label") ?? "").trim()) return true;
    const ids = (element.getAttribute("aria-labelledby") ?? "").split(/\s+/).filter(Boolean);
    return ids.some((id) => (doc.getElementById(id)?.textContent ?? "").trim().length > 0);
  };

  const elements = Array.from(doc.querySelectorAll("body *"));
  const clipped = [];
  let clippedTotal = 0;
  for (const element of elements) {
    if (!visible(element)) continue;
    const rect = element.getBoundingClientRect();
    if (rect.right <= viewport + tolerance && rect.left >= -tolerance) continue;
    clippedTotal += 1;
    // Report the first offenders only; the total keeps the report honest about scale.
    if (clipped.length < limit)
      clipped.push({ ...describe(element), left: rect.left, right: rect.right });
  }

  const smallText = [];
  let smallTextTotal = 0;
  let textElements = 0;
  for (const element of elements) {
    const hasOwnText = Array.from(element.childNodes).some(
      (node) => node.nodeType === 3 && (node.textContent ?? "").trim().length > 0,
    );
    if (!hasOwnText || !visible(element)) continue;
    textElements += 1;
    const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
    // Prose must stay readable; short incidental labels may be small print.
    const words = (element.textContent ?? "").trim().split(/\s+/).length;
    const floor = words > 6 ? minFontSize : minLabelFontSize;
    if (fontSize >= floor) continue;
    smallTextTotal += 1;
    if (smallText.length < limit) smallText.push({ ...describe(element), fontSize });
  }

  const headings = Array.from(doc.querySelectorAll("h1"));
  const heading = headings[0];
  const headingStyle = heading ? getComputedStyle(heading) : null;
  const h1 = heading
    ? {
        count: headings.length,
        visible: visible(heading),
        fontSize: Number.parseFloat(headingStyle.fontSize),
        text: (heading.textContent ?? "").trim().replace(/\s+/g, " "),
        clampedLines: headingStyle.webkitLineClamp,
        textOverflow: headingStyle.textOverflow,
        whiteSpace: headingStyle.whiteSpace,
        overflowsWidth: heading.scrollWidth > heading.clientWidth + tolerance,
        overflowsHeight: heading.scrollHeight > heading.clientHeight + tolerance,
        // Overflow is only a clipping defect when the box actually hides it.
        hidesOverflow: /hidden|clip/.test(`${headingStyle.overflowX} ${headingStyle.overflowY}`),
      }
    : { count: 0 };

  const brand = [];
  for (const element of elements) {
    const own = (element.textContent ?? "").trim();
    const nested = Array.from(element.children).some(
      (child) => (child.textContent ?? "").trim() === brandName,
    );
    const isLogo = element.tagName === "IMG" && element.getAttribute("alt") === brandName;
    if (!isLogo && (own !== brandName || nested)) continue;
    if (!visible(element)) continue;
    brand.push({
      ...describe(element),
      ...box(element),
      overflowsWidth: element.scrollWidth > element.clientWidth + tolerance,
    });
  }

  const interactive = Array.from(
    doc.querySelectorAll(
      'a[href], button, input:not([type="hidden"]), select, textarea, summary,' +
        ' [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(visible);
  const undersized = [];
  let undersizedTotal = 0;
  const measured = [];
  for (const element of interactive) {
    // A stretched card link's real target is the card its ::after covers.
    const stretched =
      element.tagName === "A" && /after:absolute/.test(element.getAttribute("class") ?? "");
    // A stretched link's real target is the positioned card its ::after covers.
    const target = stretched
      ? (element.closest("article") ?? element.offsetParent ?? element)
      : element;
    const rect = target.getBoundingClientRect();
    // WCAG 2.2 AA 2.5.8 exempts a link whose target is inline within a sentence.
    const inlineInProse =
      element.tagName === "A" &&
      getComputedStyle(element).display.startsWith("inline") &&
      /\S/.test(element.parentElement?.textContent?.replace(element.textContent ?? "", "") ?? "");
    // Icon-only controls carry no text to widen them, so they get the full 44px
    // target; labelled controls follow the 24px AA minimum in both directions.
    const named =
      (element.textContent ?? "").trim().length > 0 ||
      element.hasAttribute("aria-label") ||
      element.hasAttribute("aria-labelledby") ||
      (element.id !== "" && doc.querySelector(`label[for="${CSS.escape(element.id)}"]`) !== null) ||
      element.closest("label") !== null;
    const required = named ? minLabelledControlSize : minControlSize;
    if (
      !inlineInProse &&
      (rect.width + tolerance < required || rect.height + tolerance < required)
    ) {
      undersizedTotal += 1;
      if (undersized.length < limit)
        undersized.push({ ...describe(element), width: rect.width, height: rect.height });
    }
    if (!pinned(element)) measured.push({ element, rect });
  }
  const overlaps = [];
  for (let i = 0; i < measured.length && overlaps.length < limit; i++) {
    for (let j = i + 1; j < measured.length && overlaps.length < limit; j++) {
      const a = measured[i];
      const b = measured[j];
      if (a.element.contains(b.element) || b.element.contains(a.element)) continue;
      const width = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const height = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (width > tolerance && height > tolerance)
        overlaps.push({ a: describe(a.element), b: describe(b.element), width, height });
    }
  }

  const narrowCards = [];
  let cardsChecked = 0;
  for (const section of doc.querySelectorAll("[data-section-type]")) {
    for (const element of section.querySelectorAll("*")) {
      const parent = element.parentElement;
      if (!parent || !getComputedStyle(parent).display.includes("grid")) continue;
      if (!visible(element)) continue;
      // Only real content cards; decorative icon tiles are deliberately fixed-size.
      if (!element.querySelector("h2, h3, h4, h5, a[href]")) continue;
      cardsChecked += 1;
      const rect = element.getBoundingClientRect();
      if (rect.width + tolerance < minCardWidth)
        narrowCards.push({ ...describe(element), width: rect.width });
    }
  }

  const invalidImages = [];
  let imagesChecked = 0;
  for (const image of doc.querySelectorAll("img")) {
    if (!visible(image)) continue;
    imagesChecked += 1;
    const width = Number(image.getAttribute("width"));
    const height = Number(image.getAttribute("height"));
    // Explicit dimensions are always required; decoded pixels only once the
    // image is in view, since below-fold images are deliberately lazy.
    const rect = image.getBoundingClientRect();
    const inViewport = rect.top < innerHeight && rect.bottom > 0;
    if ((inViewport && !(image.naturalWidth > 0)) || !(width > 0) || !(height > 0))
      invalidImages.push({
        ...describe(image),
        src: (image.getAttribute("src") ?? "").slice(0, 120),
        naturalWidth: image.naturalWidth,
        width: image.getAttribute("width"),
        height: image.getAttribute("height"),
      });
  }

  const invalidTables = [];
  let tablesChecked = 0;
  for (const table of doc.querySelectorAll("table")) {
    tablesChecked += 1;
    let region = null;
    for (let node = table.parentElement; node; node = node.parentElement) {
      const overflowX = getComputedStyle(node).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") {
        region = node;
        break;
      }
    }
    if (!region || region.tabIndex !== 0 || !labelled(region))
      invalidTables.push({
        ...describe(table),
        scrollable: Boolean(region),
        tabIndex: region ? region.tabIndex : null,
        named: region ? labelled(region) : false,
      });
  }

  const header = doc.querySelector("header");
  const desktopNav = header?.querySelector('nav[aria-label="Primary"]') ?? null;
  const menuTrigger =
    Array.from(header?.querySelectorAll("button[aria-expanded]") ?? []).find((button) =>
      /menu/i.test(button.getAttribute("aria-label") ?? ""),
    ) ?? null;

  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    viewport,
    scrollWidth: doc.documentElement.scrollWidth,
    lang: doc.documentElement.lang,
    clipped,
    clippedTotal,
    smallText,
    smallTextTotal,
    textElements,
    h1,
    brand,
    controls: interactive.length,
    undersized,
    undersizedTotal,
    overlaps,
    cardsChecked,
    narrowCards,
    imagesChecked,
    invalidImages,
    tablesChecked,
    invalidTables,
    desktopNavVisible: desktopNav ? visible(desktopNav) : false,
    menuTriggerVisible: menuTrigger ? visible(menuTrigger) : false,
  };
}

/** Runs inside Chromium: footer reachability measured at the bottom of the document. */
function collectFooterFacts(tolerance) {
  const doc = document;
  const viewport = doc.documentElement.clientWidth;
  const footer = doc.querySelector('footer, [role="contentinfo"]');
  if (!footer) return { present: false, inViewport: false, links: 0, unreachable: [] };
  const rect = footer.getBoundingClientRect();
  const unreachable = [];
  let links = 0;
  for (const link of footer.querySelectorAll("a[href]")) {
    const linkRect = link.getBoundingClientRect();
    const style = getComputedStyle(link);
    const shown =
      linkRect.width > 1 &&
      linkRect.height > 1 &&
      style.visibility !== "hidden" &&
      Number(style.opacity) > 0.01;
    if (!shown || linkRect.right > viewport + tolerance || linkRect.left < -tolerance) {
      unreachable.push({
        text: (link.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60),
        left: linkRect.left,
        right: linkRect.right,
        shown,
      });
      continue;
    }
    links += 1;
  }
  return {
    present: true,
    inViewport: rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 1,
    links,
    unreachable: unreachable.slice(0, 10),
  };
}

const heightFor = (width) => (width < 768 ? 800 : 900);

async function settle(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.evaluate(() => document.fonts.ready);
}

const factsOptions = {
  minFontSize: MIN_FONT_SIZE,
  minLabelFontSize: MIN_LABEL_FONT_SIZE,
  minControlSize: MIN_CONTROL_SIZE,
  minLabelledControlSize: MIN_LABELLED_CONTROL_SIZE,
  minCardWidth: MIN_CARD_WIDTH,
  tolerance: TOLERANCE,
  limit: 10,
};

const collect = (page, brandName) =>
  page.evaluate(collectPageFacts, { ...factsOptions, brandName });

async function screenshot(page, tenant, name) {
  const filename = `${tenant.id}-${name}.png`;
  await page.screenshot({ path: path.join(output, filename), fullPage: false });
  tenant.screenshots.push(`build/responsive/${filename}`);
  count(tenant, "screenshots");
}

function assertNoOverflow(facts, width, label) {
  assert.equal(facts.innerWidth, width, `${label}: window.innerWidth must equal the set width`);
  assert(
    facts.scrollWidth <= facts.viewport + TOLERANCE,
    `${label}: horizontal scrolling — scrollWidth ${facts.scrollWidth} > clientWidth ${facts.viewport}`,
  );
}

function assertNoClipping(facts, label) {
  assert.deepEqual(
    facts.clipped,
    [],
    `${label}: ${facts.clippedTotal} visible elements extend past the viewport`,
  );
}

async function auditRoute(tenant, config, page, route, origin) {
  const record = { pageId: route.pageId, path: route.path, label: route.pageId, checks: [] };
  tenant.routes.push(record);
  count(tenant, "routes");
  const response = await page.goto(origin + route.path, { waitUntil: "load" });
  check(tenant, record, "route responds with 200 static HTML", () =>
    assert.equal(response?.status(), 200, `Unexpected status for ${route.path}`),
  );
  // Section reveals top out at 550ms; measure geometry only once motion has finished.
  await page.waitForTimeout(700);
  await settle(page);

  for (const width of WIDTHS) {
    if (interrupted) break;
    await page.setViewportSize({ width, height: heightFor(width) });
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    const facts = await collect(page, config.brand.name);
    const label = `${route.pageId}@${width}`;
    count(tenant, "widths");
    count(tenant, "viewportChecks");
    count(tenant, "controls", facts.controls);
    count(tenant, "cards", facts.cardsChecked);
    count(tenant, "images", facts.imagesChecked);
    count(tenant, "tables", facts.tablesChecked);

    check(tenant, record, `${label}: no horizontal scrolling`, () =>
      assertNoOverflow(facts, width, label),
    );
    check(tenant, record, `${label}: nothing clipped horizontally`, () =>
      assertNoClipping(facts, label),
    );
    check(tenant, record, `${label}: document language`, () =>
      assert.equal(facts.lang, config.defaultLocale, `${label}: html lang`),
    );
    check(tenant, record, `${label}: navigation usable`, () => {
      if (width >= NAV_BREAKPOINT) {
        assert(facts.desktopNavVisible, `${label}: primary navigation must be visible`);
      } else {
        assert(facts.menuTriggerVisible, `${label}: menu trigger must be visible`);
      }
    });
    check(tenant, record, `${label}: readable H1`, () => {
      assert.equal(facts.h1.count, 1, `${label}: exactly one H1`);
      assert(facts.h1.visible, `${label}: H1 must be visible`);
      assert(facts.h1.text.length > 0, `${label}: H1 must have text`);
      assert(
        facts.h1.fontSize >= MIN_HEADING_SIZE,
        `${label}: H1 font size ${facts.h1.fontSize}px below ${MIN_HEADING_SIZE}px`,
      );
      assert.equal(facts.h1.textOverflow, "clip", `${label}: H1 must not ellipsize`);
      assert.notEqual(facts.h1.whiteSpace, "nowrap", `${label}: H1 must be allowed to wrap`);
      assert(
        facts.h1.clampedLines === "none" || facts.h1.clampedLines === "",
        `${label}: H1 is line-clamped to ${facts.h1.clampedLines}`,
      );
      assert(
        !facts.h1.overflowsWidth || !facts.h1.hidesOverflow,
        `${label}: H1 text is clipped horizontally`,
      );
      assert(
        !facts.h1.overflowsHeight || !facts.h1.hidesOverflow,
        `${label}: H1 text is clipped vertically`,
      );
    });
    check(tenant, record, `${label}: body copy at least ${MIN_FONT_SIZE}px`, () =>
      assert.deepEqual(
        facts.smallText,
        [],
        `${label}: ${facts.smallTextTotal} elements below ${MIN_FONT_SIZE}px`,
      ),
    );
    check(tenant, record, `${label}: organisation name wraps inside the viewport`, () => {
      assert(facts.brand.length > 0, `${label}: brand name element not found`);
      for (const element of facts.brand) {
        assert(
          element.right <= facts.viewport + TOLERANCE && element.left >= -TOLERANCE,
          `${label}: brand name box ${element.left}-${element.right} leaves the viewport`,
        );
        assert(!element.overflowsWidth, `${label}: brand name overflows instead of wrapping`);
      }
    });
    check(tenant, record, `${label}: interactive controls at least 44x44`, () =>
      assert.deepEqual(
        facts.undersized,
        [],
        `${label}: ${facts.undersizedTotal} undersized controls of ${facts.controls}`,
      ),
    );
    check(tenant, record, `${label}: controls stack instead of overlapping`, () =>
      assert.deepEqual(facts.overlaps, [], `${label}: overlapping controls`),
    );
    check(tenant, record, `${label}: grid cards at least ${MIN_CARD_WIDTH}px wide`, () =>
      assert.deepEqual(facts.narrowCards, [], `${label}: cards squeezed below ${MIN_CARD_WIDTH}px`),
    );
    check(tenant, record, `${label}: images keep intrinsic dimensions`, () =>
      assert.deepEqual(facts.invalidImages, [], `${label}: images without stable dimensions`),
    );
    check(tenant, record, `${label}: tables scroll accessibly or are absent`, () =>
      assert.deepEqual(facts.invalidTables, [], `${label}: tables without a named scroll region`),
    );

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await settle(page);
    const footer = await page.evaluate(collectFooterFacts, TOLERANCE);
    count(tenant, "footers");
    check(tenant, record, `${label}: footer visible with reachable links`, () => {
      assert(footer.present, `${label}: footer missing`);
      assert(footer.inViewport, `${label}: footer not visible at the end of the document`);
      assert(footer.links > 0, `${label}: footer has no reachable links`);
      assert.deepEqual(footer.unreachable, [], `${label}: unreachable footer links`);
    });
    await page.evaluate(() => window.scrollTo(0, 0));

    if (route.pageId === SCREENSHOT_PAGE_ID && SCREENSHOT_WIDTHS.includes(width))
      await screenshot(page, tenant, `${route.pageId}-${width}`);
    save();
  }
  record.ok = record.checks.every((entry) => entry.ok);
  return record.ok;
}

async function auditTextScaling(tenant, config, page, routes, origin) {
  const record = { label: "text-scale", checks: [] };
  tenant.zoom.push(record);
  for (const pageId of ZOOM_PAGE_IDS) {
    const route = routes.find((entry) => entry.pageId === pageId);
    if (!route) continue;
    for (const width of TEXT_SCALE_WIDTHS) {
      if (interrupted) break;
      await page.setViewportSize({ width, height: heightFor(width) });
      await page.goto(origin + route.path, { waitUntil: "load" });
      await page.waitForTimeout(700);
      // A user text-size preference, applied to the live page; no source is modified.
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await settle(page);
      const facts = await collect(page, config.brand.name);
      const label = `${pageId}@${width} text 200%`;
      count(tenant, "textScaleChecks");
      check(tenant, record, `${label}: no horizontal scrolling`, () =>
        assertNoOverflow(facts, width, label),
      );
      check(tenant, record, `${label}: nothing clipped horizontally`, () =>
        assertNoClipping(facts, label),
      );
      await page.evaluate(() => {
        document.documentElement.style.removeProperty("font-size");
      });
      save();
    }
  }
  record.ok = record.checks.every((entry) => entry.ok);
  return record.ok;
}

async function auditZoom(tenant, config, routes, origin) {
  const record = { label: "zoom-200", checks: [] };
  tenant.zoom.push(record);
  for (const width of ZOOM_WIDTHS) {
    if (interrupted) break;
    // 200% browser zoom: half the CSS viewport at twice the device scale factor.
    const zoomed = await browser.newContext({
      viewport: { width: Math.round(width / 2), height: Math.round(heightFor(width) / 2) },
      deviceScaleFactor: 2,
      serviceWorkers: "block",
      locale: "en-GB",
    });
    activeContext = zoomed;
    const scope = { name: `zoom-${width}`, warnings: tenant.warnings };
    const network = await guardNetwork(zoomed, origin, tenant, scope);
    const page = await zoomed.newPage();
    try {
      for (const pageId of ZOOM_PAGE_IDS) {
        const route = routes.find((entry) => entry.pageId === pageId);
        if (!route) continue;
        await page.goto(origin + route.path, { waitUntil: "load" });
        await page.waitForTimeout(700);
        await settle(page);
        const facts = await collect(page, config.brand.name);
        const label = `${pageId}@${width} zoom 200%`;
        count(tenant, "zoomChecks");
        check(tenant, record, `${label}: no horizontal scrolling`, () =>
          assertNoOverflow(facts, Math.round(width / 2), label),
        );
        check(tenant, record, `${label}: nothing clipped horizontally`, () =>
          assertNoClipping(facts, label),
        );
        if (pageId === "contact" && width === ZOOM_WIDTHS[ZOOM_WIDTHS.length - 1])
          await screenshot(page, tenant, `contact-zoom-${width}`);
        save();
      }
      check(tenant, record, `zoom-${width}: clean network and console`, () =>
        network.assertClean(),
      );
    } finally {
      network.stopRecording();
      await zoomed.close();
      if (activeContext === zoomed) activeContext = undefined;
    }
  }
  record.ok = record.checks.every((entry) => entry.ok);
  return record.ok;
}

process.once("SIGINT", onInterrupt);
process.once("SIGTERM", onTerminate);
const args = process.argv.slice(2);
try {
  save(); // Persist a running record even if dependency import or Chromium launch fails.
  assert(
    args.length <= 1 && (args.length === 0 || /^--tenant=[a-z0-9-]+$/.test(args[0])),
    "Usage: verify-responsive.mjs [--tenant=id]",
  );
  const requested = args[0]?.slice("--tenant=".length);
  const playwright = await import("@playwright/test");
  const { createServer } = await import("vite");
  assert(!interrupted, "Audit interrupted");
  // Configuration compiler only: no listener, app plugins, env files, HMR or discovery.
  // Native Node cannot resolve the bundler-style JSON imports in authored content.
  vite = await createServer({
    root,
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "error",
    resolve: { alias: { "@": path.join(root, "src") } },
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  const { config } = await vite.ssrLoadModule("/src/site/index.ts");
  const { siteBasePath } = await vite.ssrLoadModule("/src/lib/site-url.ts");
  assert(requested === undefined || requested === config.id, "Unknown audit tenant");
  const selected = [config.id];
  assert(selected.length > 0, "No tenant selected");

  const executablePath = playwright.chromium.executablePath();
  assert(
    fs.existsSync(executablePath),
    "Installed Chromium is missing; no browser download will be attempted",
  );
  browser = await playwright.chromium.launch({
    headless: true,
    executablePath,
    args: ["--disable-background-networking", "--disable-component-update", "--no-proxy-server"],
  });
  assert(!interrupted, "Audit interrupted");

  for (const id of selected) {
    if (interrupted) break;
    const tenant = {
      id,
      ok: false,
      counters: counters(),
      routes: [],
      zoom: [],
      screenshots: [],
      warnings: [],
    };
    report.tenants.push(tenant);
    count(tenant, "tenants");
    let context;
    let network;
    try {
      const basePath = siteBasePath(config.siteUrl);
      const mount = (local) => (basePath === "/" ? local : `${basePath}${local}`);
      const routes = ROUTE_PAGE_IDS.filter((pageId) => config.pages[pageId].enabled).map(
        (pageId) => ({ pageId, path: mount(config.pages[pageId].path) }),
      );
      tenant.configuration = {
        defaultLocale: config.defaultLocale,
        basePath,
        routes: routes.map((route) => route.path),
        disabledPages: ROUTE_PAGE_IDS.filter((pageId) => !config.pages[pageId].enabled),
      };
      const dist = path.join(root, "dist");
      assert(
        fs.existsSync(path.join(dist, "index.html")),
        `Missing built output: dist/index.html. Build first; this audit never builds.`,
      );
      const port = await availablePort();
      assert(!interrupted, "Audit interrupted");
      activeServer = launchPreview(tenant, port);
      await activeServer.ready;
      const origin = activeServer.origin;

      context = await browser.newContext({
        viewport: { width: WIDTHS[WIDTHS.length - 1], height: 900 },
        serviceWorkers: "block",
        locale: "en-GB",
      });
      activeContext = context;
      const scope = { name: "widths", warnings: tenant.warnings };
      network = await guardNetwork(context, origin, tenant, scope);
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(30000);
      page.setDefaultTimeout(15000);

      let ok = true;
      for (const route of routes) {
        if (interrupted) break;
        ok = (await auditRoute(tenant, config, page, route, origin)) && ok;
      }
      ok = (await auditTextScaling(tenant, config, page, routes, origin)) && ok;
      network.stopRecording();
      await context.close();
      if (activeContext === context) activeContext = undefined;
      const record = { label: "network", checks: [] };
      tenant.zoom.push(record);
      ok =
        check(tenant, record, "clean network, console and page errors", () =>
          network.assertClean(),
        ) && ok;
      context = undefined;
      ok = (await auditZoom(tenant, config, routes, origin)) && ok;
      assert(!activeServer.closed, "Owned preview server exited during the audit");
      tenant.ok = ok && !interrupted && tenant.counters.checksFailed === 0;
    } catch (error) {
      tenant.error = message(error);
      console.error(`FAIL ${id}: ${error.message ?? error}`);
    } finally {
      try {
        network?.stopRecording();
        if (context) await context.close();
        if (activeContext === context) activeContext = undefined;
        await stopServer(activeServer);
      } catch (error) {
        tenant.ok = false;
        tenant.cleanupError = message(error);
        report.cleanupErrors.push({ resource: id, error: message(error) });
      }
      activeServer = undefined;
      save();
    }
    console.log(
      `${tenant.ok ? "PASS" : "FAIL"} ${tenant.id}: ${tenant.counters.routes} routes, ` +
        `${tenant.counters.widths} width checks, ${tenant.counters.zoomChecks} zoom checks, ` +
        `${tenant.counters.textScaleChecks} text-scale checks, ` +
        `${tenant.counters.checksPassed} passed / ${tenant.counters.checksFailed} failed`,
    );
    // Never start another preview while an owned process might still hold the port.
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
    report.counters.checksFailed === 0 &&
    report.tenants.length > 0 &&
    report.tenants.every((tenant) => tenant.ok);
  report.status = report.ok ? "passed" : "failed";
  process.exitCode = report.ok ? 0 : 1;
  save();
  process.removeListener("SIGINT", onInterrupt);
  process.removeListener("SIGTERM", onTerminate);
  console.log(
    `RESPONSIVE_AUDIT_EXIT=${process.exitCode}: ${report.tenants.length} tenants, ` +
      `${report.counters.routes} routes, ${report.counters.widths} route/width visits, ` +
      `${report.counters.checksPassed} passed checks, ${report.counters.checksFailed} failed checks, ` +
      `${report.counters.screenshots} screenshots; ${path.relative(root, reportPath)}`,
  );
}
