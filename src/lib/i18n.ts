import { messages, Locale } from "@/messages";

export const defaultLocale: Locale = "uk";

export const locales: Locale[] = ["uk", "en"];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getMessages(locale: string) {
  if (isLocale(locale)) {
    return messages[locale];
  }

  return messages[defaultLocale];
}