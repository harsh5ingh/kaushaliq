import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const motionPreference = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");
const subscribeMotion = (listener: () => void) => {
  motionPreference?.addEventListener("change", listener);
  return () => motionPreference?.removeEventListener("change", listener);
};
const getReducedMotion = () => motionPreference?.matches ?? true;

/** Animates presentation only: the accessible value is always the actual target. */
export function CountUp({ value, format, duration = 1500 }: {
  value: number;
  format: (value: number) => string;
  duration?: number;
}) {
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, () => true);
  const displayed = useRef(reducedMotion ? value : 0);
  const [frame, setFrame] = useState(() => ({ value: reducedMotion ? value : 0, target: value, complete: reducedMotion || value === 0 }));

  useEffect(() => {
    const from = displayed.current;
    if (reducedMotion || duration <= 0 || from === value) {
      displayed.current = value;
      setFrame({ value, target: value, complete: true });
      return;
    }

    let cancelled = false;
    let request = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
      const eased = 1 - (1 - progress) ** 3;
      // Assign the source value directly on completion, avoiding rounding drift.
      const next = progress === 1 ? value : Math.round(from + (value - from) * eased);
      displayed.current = next;
      setFrame({ value: next, target: value, complete: progress === 1 });
      if (progress < 1) request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(request); };
  }, [value, duration, reducedMotion]);

  const current = reducedMotion ? value : frame.value;
  const complete = reducedMotion || (frame.complete && frame.target === value);
  return <span className="metric-count-up" data-countup-state={complete ? "settled" : "animating"}>
    <span className="sr-only" data-countup-final>{format(value)}</span>
    <span className="metric-count-up-reserve" aria-hidden="true">{format(value)}</span>
    <span className="metric-count-up-value" aria-hidden="true" data-countup-value>{format(current)}</span>
  </span>;
}
