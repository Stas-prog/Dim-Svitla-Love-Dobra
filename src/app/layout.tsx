import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";



export const metadata: Metadata = {
  title: "Dim-Svitla — Дім Світла, Любові й Добра",
  description:
    "Дім Світла — простір єдності та миру. Один Творець для всіх. Медитації, духовне зростання та любов як шлях у майбутнє. Закликаємо до завершення війн і змагань, що породжують агресію. Світло, що сходить у серці",
  openGraph: {
    title: "Дім Світла, Любові й Добра",
    description:
      "Єдність релігій і народів. Один Творець для всіх. Простір миру, медитацій і духовного зростання. Закликаємо до завершення війн і змагань, що породжують агресію. Світло, що сходить у серці",
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
      "Unity of faiths and peoples. One Creator for all. A space of peace, meditation, and spiritual growth.",
    images: ["https://dim-svitla-love-dobra.vercel.app/og-image.jpg"],
  },
};



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">      
      <body className="min-h-dvh text-slate-800 selection:bg-yellow-200/60 selection:text-slate-900">
      <Navbar/>
        <div className="relative min-h-dvh dawn-gradient animate-glow">
          <div className="dawn-glow absolute inset-x-0 top-0 h-48" />
          {children}
        </div>
      </body>
    </html>
  );
}
