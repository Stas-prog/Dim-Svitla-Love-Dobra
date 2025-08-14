import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Дім Світла, Любові і Добра",
  description: "Світло, що сходить у серці",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="min-h-dvh text-slate-800 selection:bg-yellow-200/60 selection:text-slate-900">
        <div className="relative min-h-dvh dawn-gradient animate-glow">
          {/* ледь помітне верхнє сяйво */}
          <div className="dawn-glow absolute inset-x-0 top-0 h-48" />
          {children}
        </div>
      </body>
    </html>
  );
}
