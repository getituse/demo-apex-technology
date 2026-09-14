import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

export interface RunningNumberProps {
  value: string;
  className?: string;
  duration?: number;
  trigger?: boolean;
}

function parseMetricValue(raw: string) {
  const match = raw.trim().match(/^([^0-9.]*)([0-9,]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) return null;

  const prefix = match[1] ?? "";
  const numStr = match[2] ?? "";
  const suffix = match[3] ?? "";

  const hasCommas = numStr.includes(",");
  const cleanNumStr = numStr.replace(/,/g, "");
  const target = parseFloat(cleanNumStr);

  if (isNaN(target)) return null;

  const decimalParts = cleanNumStr.split(".");
  const decimals = decimalParts.length > 1 ? decimalParts[1]!.length : 0;

  return { prefix, target, suffix, decimals, hasCommas };
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Animated running counter for metrics and numerical statistics.
 * Renders static server HTML for SEO and accessibility, and smoothly counts up
 * from 0 to the target number only when scrolled into view.
 */
export function RunningNumber({
  value,
  className,
  duration = 1600,
  trigger,
}: RunningNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || hasAnimatedRef.current) return;

    const parsed = parseMetricValue(value);
    if (!parsed) return;

    // Respect reduced motion preference or non-browser environments
    if (reducedMotion || typeof window === "undefined") {
      hasAnimatedRef.current = true;
      return;
    }

    const { prefix, target, suffix, decimals, hasCommas } = parsed;

    const formatNumber = (current: number) => {
      let formattedNumber =
        decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString();

      if (hasCommas) {
        const parts = formattedNumber.split(".");
        parts[0] = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        formattedNumber = parts.join(".");
      }

      return `${prefix}${formattedNumber}${suffix}`;
    };

    let frameId: number;

    const startAnimation = () => {
      hasAnimatedRef.current = true;
      const startTime = performance.now();

      const update = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuart(progress);
        const current = eased * target;

        node.textContent = formatNumber(current);

        if (progress < 1) {
          frameId = requestAnimationFrame(update);
        } else {
          node.textContent = value;
        }
      };

      frameId = requestAnimationFrame(update);
    };

    // Case 1: External trigger provided (e.g., from metrics container IntersectionObserver)
    if (trigger !== undefined) {
      if (trigger) {
        startAnimation();
      } else {
        node.textContent = formatNumber(0);
      }
      return () => {
        if (frameId) cancelAnimationFrame(frameId);
      };
    }

    // Case 2: Standalone self-observing trigger
    if (typeof IntersectionObserver === "undefined") {
      hasAnimatedRef.current = true;
      return;
    }

    node.textContent = formatNumber(0);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          observer.disconnect();
          startAnimation();
        }
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value, duration, trigger, reducedMotion]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
