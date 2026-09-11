import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Returns focus to whatever opened a dialog.
 *
 * Radix normally does this itself, but `forceMount` keeps the panel mounted for its
 * exit animation, so Radix's restore runs while focus is still inside a closing
 * dialog and ends up on `<body>`. Capturing the previously focused element on open
 * and restoring it after the exit animation completes puts it back where it belongs.
 */
export function useDialogReturnFocus(open: boolean) {
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const isOpen = useRef(open);
  const frame = useRef<number | null>(null);
  const observer = useRef<MutationObserver | null>(null);

  useLayoutEffect(() => {
    isOpen.current = open;
    const active = document.activeElement;
    if (open && active instanceof HTMLElement && !active.closest('[role="dialog"]')) {
      previouslyFocused.current = active;
    }
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      observer.current?.disconnect();
    };
  }, [open]);

  return useCallback(() => {
    const target = previouslyFocused.current;
    if (isOpen.current || !target?.isConnected) return;

    // Wait for actual Radix cleanup rather than assuming one frame is always enough.
    function restore() {
      frame.current = null;
      if (isOpen.current || !target?.isConnected) {
        observer.current?.disconnect();
        return;
      }
      if (
        target.closest('[aria-hidden="true"], [inert]') ||
        document.querySelector('[role="dialog"][aria-modal="true"]')
      )
        return;
      observer.current?.disconnect();
      const active = document.activeElement;
      if (
        active &&
        active !== document.body &&
        active !== target &&
        !active.closest('[role="dialog"]')
      )
        return;
      target.focus({ preventScroll: true });
    }
    observer.current?.disconnect();
    observer.current = new MutationObserver(restore);
    observer.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-hidden", "inert"],
    });
    frame.current = requestAnimationFrame(restore);
  }, []);
}
