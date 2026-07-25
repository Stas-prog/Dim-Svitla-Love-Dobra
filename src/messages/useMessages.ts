"use client";

import { usePathname } from "next/navigation";
import { getMessages } from "@/lib/i18n";

export function useMessages() {
  const pathname = usePathname();

  const locale = pathname.split("/")[1] || "uk";

  return getMessages(locale);
}