/* Blocking head bootstrap and single theme store. No credentials are read or written. */
(() => {
  const key = "kaushaliq.theme.v1";
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const valid = value => ["light", "dark", "system"].includes(value) ? value : "system";
  let preference = "system";
  try { preference = valid(localStorage.getItem(key)); } catch { /* In-memory fallback. */ }
  let snapshot;
  const listeners = new Set();
  function apply() {
    const resolved = preference === "system" ? (media.matches ? "dark" : "light") : preference;
    if (snapshot?.preference === preference && snapshot.resolved === resolved) return;
    snapshot = Object.freeze({ preference, resolved });
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    // Palette stays in CSS; read it after CSS is ready and on preference updates.
    const canvas = getComputedStyle(document.documentElement).getPropertyValue("--bg-canvas").trim();
    if (canvas) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", canvas);
    listeners.forEach(listener => listener());
  }
  window.kaushaliqTheme = {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    setPreference: value => {
      preference = valid(value);
      try { localStorage.setItem(key, preference); } catch { /* Keep the current session usable. */ }
      apply();
    },
  };
  apply();
  document.addEventListener("DOMContentLoaded", () => {
    const canvas = getComputedStyle(document.documentElement).getPropertyValue("--bg-canvas").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", canvas);
  }, { once: true });
  media.addEventListener("change", apply);
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) { preference = valid(event.newValue); apply(); }
  });
})();
