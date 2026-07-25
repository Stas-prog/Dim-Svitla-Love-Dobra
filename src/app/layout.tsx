import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dim-Svitla — Дім Світла, Любові й Добра",
  description:
    "Дім Світла — простір єдності та миру. Один Творець для всіх. Медитації, духовне зростання та любов як шлях у майбутнє. Закликаємо до завершення війн і змагань, що породжують агресію. Світло, що сходить у серці.",
  openGraph: {
    title: "Дім Світла, Любові й Добра",
    description:
      "Єдність релігій і народів. Один Творець для всіх. Простір миру, медитацій і духовного зростання.",
    url: "https://dim-svitla-love-dobra.vercel.app",
    siteName: "Дім Світла",
    images: [
      {
        url: "https://dim-svitla-love-dobra.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "House of Light — Unity & Peace",
      },
    ],
    locale: "uk_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "House of Light, Love & Goodness",
    description:
      "Unity of faiths and peoples. One Creator for all.",
    images: [
      "https://dim-svitla-love-dobra.vercel.app/og-image.jpg",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}