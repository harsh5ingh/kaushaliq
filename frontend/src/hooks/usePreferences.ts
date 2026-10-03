import { useContext } from "react";
import { ThemeContext, LocaleContext } from "../app/providers/preferenceContexts";
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("ThemeProvider is required");
  return value;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("I18nProvider is required");
  return value;
}
