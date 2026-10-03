import { en, type MessageKey } from "./locales/en-IN";
import { hi } from "./locales/hi-IN";
export type { MessageKey } from "./locales/en-IN";
export const localeKey = "kaushaliq.locale.v1";
export const locales = {
  "en-IN": { nativeLabel: "English", lang: "en", direction: "ltr" },
  "hi-IN": { nativeLabel: "हिन्दी", lang: "hi", direction: "ltr" },
} as const;
export type Locale = keyof typeof locales;
export type Translator = (key: MessageKey, values?: Record<string, string | number>) => string;
export function parseLocale(value: unknown): Locale { return value === "hi-IN" ? "hi-IN" : "en-IN"; }
const messages: Record<Locale, Record<MessageKey, string>> = { "en-IN": en, "hi-IN": hi };
export function message(locale: Locale, key: MessageKey, values: Record<string, string | number> = {}): string {
  return messages[locale][key].replace(/\{(\w+)\}/g, (placeholder, name: string) => String(values[name] ?? placeholder));
}
