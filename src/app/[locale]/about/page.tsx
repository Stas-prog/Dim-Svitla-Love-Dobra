import React, { JSX } from "react";
import { getMessages } from "@/lib/i18n";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = getMessages(locale);

  return {
    title: `${t.about.title} — House of Light`,
    description: t.about.description,
  };
}

export default async function AboutPage({
  params,
}: Props): Promise<JSX.Element> {
  const { locale } = await params;
  const t = getMessages(locale);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-zinc-900 text-white antialiased">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">

        <h1 className="text-3xl sm:text-4xl font-extrabold">
          {t.about.title}
        </h1>

        <section className="space-y-4">
          {t.about.paragraphs.map((paragraph: string, index: number) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>

        <footer className="pt-10 text-center text-zinc-400 text-sm">
          <p>{t.about.footer.text}</p>

          <p className="mt-4">
            {t.about.footer.sign}
          </p>
        </footer>

      </div>
    </main>
  );
}