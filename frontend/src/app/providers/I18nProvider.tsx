import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { localeKey, locales, message, parseLocale, type Locale, type Translator } from "../i18n/config";
import { LocaleContext } from "./preferenceContexts";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, update] = useState<Locale>(() => {
    try { return parseLocale(localStorage.getItem(localeKey)); } catch { return "en-IN"; }
  });
  useLayoutEffect(() => {
    document.documentElement.lang = locales[locale].lang;
    document.documentElement.dir = locales[locale].direction;
  }, [locale]);
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === localeKey || event.key === null) update(parseLocale(event.newValue));
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const setLocale = useCallback((next: Locale) => {
    update(next);
    try { localStorage.setItem(localeKey, next); } catch { /* In-memory preference still works. */ }
  }, []);
  const t = useCallback<Translator>((key, values) => message(locale, key, values), [locale]);
  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}
