// Isolated browser fixture, not imported by application routes or production code.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CountUp } from "../src/components/ui/CountUp";

export function mountCountUp(value: number) {
  const host = document.createElement("div");
  host.id = "count-up-fixture";
  document.body.append(host);
  const root = createRoot(host);
  const nativeRequest = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const pending = new Set<number>();
  window.requestAnimationFrame = callback => {
    const id = nativeRequest(now => { pending.delete(id); callback(now); });
    pending.add(id);
    return id;
  };
  window.cancelAnimationFrame = id => { pending.delete(id); nativeCancel(id); };
  function render(target: number, locale = "en-GB") {
    // Deliberately recreate formatter/JSX to exercise ordinary parent re-renders.
    root.render(<StrictMode><CountUp value={target} format={n => new Intl.NumberFormat(locale).format(n)} /></StrictMode>);
  }
  render(value);
  return {
    render,
    pendingFrames: () => pending.size,
    unmount() {
      root.unmount();
      host.remove();
      const remaining = pending.size;
      window.requestAnimationFrame = nativeRequest;
      window.cancelAnimationFrame = nativeCancel;
      return remaining;
    },
  };
}
