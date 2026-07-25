"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/messages/useMessages";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const t = useMessages();

  const locale = pathname.split("/")[1] || "uk";

  const route = (path: string) =>
    `/${locale}${path === "/" ? "" : path}`;

  const linkClass = (path: string) => {
    const href = route(path);

    return `block px-3 py-2 rounded hover:text-sky-400 transition ${
      pathname === href
        ? "text-sky-400 font-semibold"
        : "text-white"
    }`;
  };

  const links = [
    {
      href: "/",
      label: `🏠 ${t.nav.home}`,
    },
    {
      href: "/mission",
      label: `🌍 ${t.nav.mission}`,
    },
    {
      href: "/about",
      label: `👥 ${t.nav.about}`,
    },
    {
      href: "/contact",
      label: `📬 ${t.nav.contact}`,
    },
    {
      href: "/manifest",
      label: `📜 ${t.nav.manifest}`,
    },
    {
      href: "/rooms",
      label: `🏛 ${t.nav.rooms}`,
    },
  ];

  const otherLocale = locale === "uk" ? "en" : "uk";

  const switchHref =
  "/" +
  otherLocale +
  pathname.replace(/^\/(uk|en)/, "");

  return (
    <nav className="w-full bg-blue-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          <Link
            href={route("/")}
            className="text-xl font-bold text-sky-400"
          >
            🏠
          </Link>

          <div className="hidden md:flex items-center gap-2">
  <Link
    href={switchHref}
    className="rounded-lg border border-sky-500 px-3 py-1 text-sm font-semibold text-sky-300 hover:bg-sky-700 transition"
  >
    {locale === "uk" ? "EN" : "UK"}
  </Link>
</div>

          <div className="hidden md:flex gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={route(link.href)}
                className={linkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-md hover:bg-slate-800"
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

      {open && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 bg-slate-800">
          {links.map((link) => (
            <Link
              key={link.href}
              href={route(link.href)}
              className={linkClass(link.href)}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
  href={switchHref}
  className="block px-3 py-2 rounded text-sky-300 hover:text-sky-400"
  onClick={() => setOpen(false)}
>
  🌐 {locale === "uk" ? "English" : "Українська"}
</Link>
        </div>
      )}
    </nav>
  );
}