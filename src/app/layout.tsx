

import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Дім Світла, Любові і Добра',
  description: 'Місце тепла, творчості та сили. Разом до Світла! 🌟',
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="min-h-screen bg-[#06070a] text-zinc-100 antialiased">
        {/* М’яке “неонове” світіння фону */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="pointer-events-none absolute -top-32 left-1/2 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-400/15 via-pink-400/10 to-indigo-500/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-20rem] right-[-10rem] h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-cyan-400/10 to-lime-300/10 blur-3xl" />
        </div>

        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
