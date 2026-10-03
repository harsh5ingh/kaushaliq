import { Globe2, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/usePreferences";
import type { ThemePreference } from "../../app/providers/preferenceContexts";
import { useLocale } from "../../hooks/usePreferences";
import { locales, type Locale } from "../../app/i18n/config";
import { PreferenceMenu } from "./PreferenceMenu";

export function ThemeSwitcher() {

  const { preference, setPreference } = useTheme();
  const { t } = useLocale();
  const Icon = preference === "system" ? Monitor : preference === "dark" ? Moon : Sun;
  return <PreferenceMenu<ThemePreference> label={t("common.appearance")} icon={<Icon size={18} aria-hidden="true" />} value={preference} onChange={setPreference}
    options={[{ value: "light", label: t("common.light"), icon: <Sun size={17} aria-hidden="true" /> }, { value: "dark", label: t("common.dark"), icon: <Moon size={17} aria-hidden="true" /> }, { value: "system", label: t("common.system"), icon: <Monitor size={17} aria-hidden="true" /> }]} />;
}
export function LanguageSwitcher() {

  const { locale, setLocale, t } = useLocale();
  return <PreferenceMenu<Locale> showValue label={t("common.language")} icon={<Globe2 size={18} aria-hidden="true" />} value={locale} onChange={setLocale}
    options={(Object.keys(locales) as Locale[]).map(value => ({ value, label: locales[value].nativeLabel, lang: locales[value].lang }))}
    description={t("preferences.languageHelp")} />;
}
export function ProductPreferences() {
  const { t } = useLocale();

  return <div className="product-preferences" role="group" aria-label={t("common.preferences")}><ThemeSwitcher /><LanguageSwitcher /></div>;
}
