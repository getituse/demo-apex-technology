import { useEffect, useState } from "react";
import { useLocation } from "react-router";

// Error routes can remount the layout; navigation history belongs to the document, not that mount.
const handledLocations = new WeakMap<Document, string>();

export function useRouteAnnouncement(): string {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!handledLocations.has(document)) {
      handledLocations.set(document, location.key);
      return;
    }
    if (handledLocations.get(document) === location.key) return;

    setAnnouncement("");
    let timer: number | undefined;
    let done = false;
    const observer = new MutationObserver(focusPage);

    function focusPage() {
      const main = document.getElementById("main");
      // A closing drawer still hides the page until its exit animation unmounts it.
      if (
        done ||
        !main ||
        main.closest('[aria-hidden="true"], [inert]') ||
        document.querySelector('[role="dialog"][aria-modal="true"]')
      )
        return;
      const route = main.querySelector<HTMLElement>("[data-route-path]");
      if (route && route.dataset.routePath !== location.pathname) return;
      const heading = main.querySelector<HTMLElement>("h1");
      const target = heading ?? main;
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      done = true;
      handledLocations.set(document, location.key);
      observer.disconnect();
      const title = heading?.textContent?.trim() || document.title;
      timer = window.setTimeout(() => setAnnouncement(`${title}. Page loaded.`), 60);
    }

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-hidden", "inert", "data-route-path"],
    });
    focusPage();
    return () => {
      observer.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [location.key, location.pathname]);

  return announcement;
}

/** Renders the live region the hook writes into. Mount once, at the app root. */
export function RouteAnnouncer() {
  const announcement = useRouteAnnouncement();

  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </p>
  );
}
