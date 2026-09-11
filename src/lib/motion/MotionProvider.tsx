import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Wraps the app once.
 *
 * `reducedMotion="user"` makes every transform and layout animation respect the OS
 * setting without a single component checking for it.
 *
 * `LazyMotion` + `domAnimation` loads the DOM animation feature set only, which is
 * roughly half the size of the full `motion` bundle. It is the reason components
 * import `m` rather than `motion` — `motion.div` would pull the whole feature set
 * back in and silently undo this.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
