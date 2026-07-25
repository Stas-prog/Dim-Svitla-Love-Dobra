import type { ReactNode } from "react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { MessagesProvider } from "@/components/ui/MessagesProvider";
import { getMessages } from "@/lib/i18n";

type Props = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;

  const t = getMessages(locale);

  return (
    <MessagesProvider messages={t}>
      <Header />

      <main className="relative min-h-dvh dawn-gradient">
        <div className="dawn-glow absolute inset-x-0 top-0 h-48" />

        {children}
      </main>

      <Footer locale={locale} variant="dark"/>
    </MessagesProvider>
  );
}