import { createContext } from "react";
import type { Locale, Translator } from "../i18n/config";
export type ThemePreference = "light" | "dark" | "system";
type ThemeSnapshot = { preference: ThemePreference; resolved: "light" | "dark" };
declare global {
  interface Window {
    kaushaliqTheme: {
      getSnapshot: () => ThemeSnapshot;
      subscribe: (listener: () => void) => () => void;
      setPreference: (preference: ThemePreference) => void;
    };
  }
}
export const ThemeContext = createContext<(ThemeSnapshot & { setPreference: (value: ThemePreference) => void }) | null>(null);
type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: Translator };
export const LocaleContext = createContext<LocaleContextValue | null>(null);
