// @vitest-environment node
import { act } from "react";
import { createRoot, hydrateRoot, type Root as ReactRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import { TenantProvider } from "@/lib/tenant/TenantProvider";
import { MotionProvider } from "@/lib/motion";
import { RouteTransition } from "@/lib/motion/RouteTransition";
import { config, content } from "@/site";
import * as homeModule from "@/routes/home";
import * as detailModule from "@/routes/tenant-detail";

vi.mock("@/site", async () => import("@/site"));

// Install the DOM before Motion evaluates its isBrowser flag, while keeping
// Node's Request/AbortSignal paired. jsdom has no installed declarations here.
const dom = await vi.hoisted(async () => {
  const { createRequire } = await import("node:module");
  const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
    JSDOM: new (
      html: string,
      options: { url: string; pretendToBeVisual: boolean },
    ) => {
      window: Window & typeof globalThis;
    };
  };
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "https://example.test/",
    pretendToBeVisual: true,
  });
  for (const key of [
    "window",
    "document",
    "Element",
    "HTMLElement",
    "SVGElement",
    "Node",
  ] as const) {
    vi.stubGlobal(key, dom.window[key]);
  }
  vi.stubGlobal("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
  vi.stubGlobal("requestAnimationFrame", dom.window.requestAnimationFrame.bind(dom.window));
  vi.stubGlobal("cancelAnimationFrame", dom.window.cancelAnimationFrame.bind(dom.window));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  return dom;
});

afterEach(() => {
  dom.window.document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(() => {
  dom.window.close();
  vi.unstubAllGlobals();
});

function Root() {
  return (
    <TenantProvider config={config} content={content}>
      <MotionProvider>
        <main>
          <RouteTransition />
        </main>
      </MotionProvider>
    </TenantProvider>
  );
}

describe("core route loader snapshot lifecycle", () => {
  it("hydrates with the serialized snapshot even after the browser date changes", async () => {
    const errors = vi.spyOn(console, "error");
    const onError = vi.fn();
    const snapshot = { referenceTime: "2026-01-01T00:00:00.000Z" };
    const loader = vi.fn(homeModule.loader);
    const router = createMemoryRouter(
      [
        {
          id: "root",
          Component: Root,
          children: [{ id: "home", index: true, Component: homeModule.default, loader }],
        },
      ],
      { hydrationData: { loaderData: { home: snapshot } } },
    );
    let root: ReactRoot | undefined;
    try {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(snapshot.referenceTime);
      const view = <RouterProvider router={router} onError={onError} />;
      const html = renderToString(view);
      dom.window.document.body.innerHTML = html;
      const serverText = dom.window.document.body.textContent;
      vi.setSystemTime("2040-01-01T00:00:00.000Z");
      await act(() => {
        root = hydrateRoot(dom.window.document.body, view, { onRecoverableError: onError });
      });
      expect(router.state.loaderData.home).toBe(snapshot);
      expect(loader).not.toHaveBeenCalled();
      expect(homeModule.clientLoader).not.toHaveProperty("hydrate");
      expect(dom.window.document.body.textContent).toBe(serverText);
      expect(dom.window.document.querySelectorAll("h1")).toHaveLength(1);
      expect(onError).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    } finally {
      await act(() => root?.unmount());
      router.dispose();
    }
  });

  it("does not render a departing home route against the destination loader data", async () => {
    const errors = vi.spyOn(console, "error");
    const onError = vi.fn();
    const detailPath = `/programs/${content.programs[0]!.slug}`;
    const router = createMemoryRouter(
      [
        {
          id: "root",
          Component: Root,
          children: [
            { id: "home", index: true, Component: homeModule.default, loader: homeModule.loader },
            {
              id: "detail",
              path: detailPath,
              Component: detailModule.default,
              loader: detailModule.loader,
            },
          ],
        },
      ],
      { initialEntries: [detailPath], hydrationData: { loaderData: { detail: null } } },
    );
    const root = createRoot(dom.window.document.body);
    try {
      await act(() => root.render(<RouterProvider router={router} onError={onError} />));
      await act(() => router.navigate("/"));
      expect(router.state.loaderData.home).toEqual({ referenceTime: expect.any(String) });
      await act(() => router.navigate(-1));
      expect(router.state.loaderData).not.toHaveProperty("home");
      expect(onError).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
      expect(dom.window.document.querySelectorAll("h1")).toHaveLength(1);
      await act(() => router.navigate(1));
      expect(dom.window.document.querySelectorAll("h1")).toHaveLength(1);
      expect(onError).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    } finally {
      await act(() => root.unmount());
      router.dispose();
    }
  });
});
