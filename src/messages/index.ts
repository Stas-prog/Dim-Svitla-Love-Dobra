import uk from "./uk";
import en from "./en";

export const messages = {
  uk,
  en,
};

export type Locale = keyof typeof messages;

export async function getMessages(locale: Locale) {
  return messages[locale];
}