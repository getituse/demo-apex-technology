import { useLocation, useOutlet } from "react-router";
import { AnimatePresence, m, useReducedMotion } from "motion/react";

import { pageTransition } from "./variants";

export function RouteTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const reducedMotion = useReducedMotion();

  // Entry-only fades remove stale interactive pages immediately; first paint never waits.
  return (
    <AnimatePresence initial={false}>
      <m.div
        key={location.pathname}
        data-route-path={location.pathname}
        variants={pageTransition}
        initial={reducedMotion ? false : "hidden"}
        animate="visible"
      >
        {outlet}
      </m.div>
    </AnimatePresence>
  );
}
