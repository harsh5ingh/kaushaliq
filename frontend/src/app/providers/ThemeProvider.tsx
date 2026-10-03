import { useSyncExternalStore, type ReactNode } from "react";
import { ThemeContext } from "./preferenceContexts";
export function ThemeProvider({ children }: { children: ReactNode }) {
  const store = window.kaushaliqTheme;
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return <ThemeContext.Provider value={{ ...snapshot, setPreference: store.setPreference }}>{children}</ThemeContext.Provider>;
}
