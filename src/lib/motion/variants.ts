import type { Variants } from "motion/react";

/**
 * Every animation in the product lives here.
 *
 * Components import a variant; they never define an animation object inline. That is
 * what keeps timing consistent and makes a global change a one-file edit.
 *
 * Rules encoded below:
 *  - opacity and transform only, so nothing triggers layout
 *  - no delay on anything that can be above the fold
 *  - entrances are subtle: 8-16px of travel, never a slide across the screen
 *  - a list animates as one staggered group, never as independent per-card timers
 */

/** Duration bands from design-system/MASTER.md section 7, in seconds. */
export const DURATION = {
  micro: 0.18,
  overlay: 0.24,
  reveal: 0.45,
} as const;

export const EASE = {
  /** Decelerating: entrances. */
  out: [0.16, 1, 0.3, 1],
  /** Symmetric: movements that start and end on screen. */
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.reveal, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DURATION.micro, ease: EASE.inOut } },
};

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE.out } },
  exit: { opacity: 0, y: 8, transition: { duration: DURATION.micro, ease: EASE.inOut } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.overlay, ease: EASE.out } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DURATION.micro, ease: EASE.inOut } },
};

/**
 * Parent of a list. `delayChildren` stays 0 so a group that happens to be above the
 * fold still paints immediately; only the offset between siblings is staggered.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0 } },
  exit: {},
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DURATION.micro } },
};

export const galleryItem: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.overlay, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DURATION.micro } },
};

export const dropdown: Variants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.micro, ease: EASE.out } },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.micro, ease: EASE.inOut } },
};

export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION.overlay, ease: EASE.out },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DURATION.micro, ease: EASE.inOut } },
};

export const overlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.overlay } },
  exit: { opacity: 0, transition: { duration: DURATION.micro } },
};

/** Percentage translate so the panel is off-screen at any viewport width. */
export const drawer: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { duration: DURATION.overlay, ease: EASE.out } },
  exit: { x: "100%", transition: { duration: DURATION.overlay, ease: EASE.inOut } },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.micro, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DURATION.micro, ease: EASE.inOut } },
};

/**
 * Hover lift for an interactive card. `whileHover`/`whileTap` rather than a variant
 * cycle, so an interrupted hover always settles back on the rest state.
 */
export const hoverElevation = {
  rest: { y: 0 },
  hover: { y: -4, transition: { duration: DURATION.micro, ease: EASE.out } },
  tap: { y: -1, transition: { duration: 0.1 } },
} as const;
