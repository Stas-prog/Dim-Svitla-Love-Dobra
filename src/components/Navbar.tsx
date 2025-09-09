"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    `block px-3 py-2 rounded hover:text-sky-400 transition ${
      pathname === href ? "text-sky-400 font-semibold" : "text-white"
    }`;

  return (
    <nav className="w-full bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Лого або Home */}
          <Link href="/" className="text-xl font-bold text-sky-400">
            🏠
          </Link>

          {/* Десктопні посилання */}
          <div className="hidden md:flex gap-6">
            <Link href="/" className={linkClass("/")}>
              Home
            </Link>
            <Link href="/vision" className={linkClass("/vision")}>
              👁 Vision
            </Link>
            <Link href="/vision/decryptor" className={linkClass("/vision/decryptor")}>
              🗂 Слайди
            </Link>
            <Link href="/mission" className={linkClass("/mission")}>
              🌍 Місія
            </Link>
            <Link href="/about" className={linkClass("/about")}>
              👥 Про нас
            </Link>
            <Link href="/contact" className={linkClass("/contact")}>
              📬 Контакти
            </Link>
            <Link href="/snaps" className={linkClass("/snaps")}>
              📸 Snaps
            </Link>
            <Link href="/manifest" className={linkClass("/manifest")}>
              Маніфест
            </Link>
          </div>

          {/* Бургер */}
          <div className="md:hidden">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-md focus:outline-none hover:bg-slate-800"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {open ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Мобільне меню */}
      {open && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 bg-slate-800">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>
          <Link href="/vision" className={linkClass("/vision")}>
            👁 Vision
          </Link>
          <Link href="/vision/decryptor" className={linkClass("/vision/decryptor")}>
            🗂 Слайди
          </Link>
          <Link href="/mission" className={linkClass("/mission")}>
            🌍 Місія
          </Link>
          <Link href="/about" className={linkClass("/about")}>
            👥 Про нас
          </Link>
          <Link href="/contact" className={linkClass("/contact")}>
            📬 Контакти
          </Link>
          <Link href="/snaps" className={linkClass("/snaps")}>
            📸 Snaps
          </Link>
          <Link href="/manifest" className={linkClass("/manifest")}>
            Маніфест
          </Link>
        </div>
      )}
    </nav>
  );
}
