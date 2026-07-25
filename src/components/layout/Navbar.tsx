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

    return `
      flex
      items-center
      rounded-full
      px-4
      py-2
      text-sm
      font-medium
      transition-all
      duration-300
      ${
        pathname === href
          ? "bg-sky-500/15 text-sky-300 shadow-sm"
          : "text-white hover:bg-white/10 hover:text-sky-300"
      }
    `;
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

  const otherLocale =
    locale === "uk" ? "en" : "uk";

  const switchHref =
    "/" +
    otherLocale +
    pathname.replace(/^\/(uk|en)/, "");

  return (
    <nav
      className="
        sticky
        top-0
        z-50
        w-full
        bg-gradient-to-b
        from-blue-900
        via-[#1b4aa8]
        to-[#173b88]
        border-b
        border-white/10
        shadow-xl
        backdrop-blur-md
        text-white
      "
    >
      <div
        className="
          mx-auto
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        <div className="flex h-20 items-center justify-between">

          <Link
            href={route("/")}
            className="
              text-3xl
              font-bold
              text-sky-300
              drop-shadow-lg
              transition-all
              duration-300
              hover:scale-110
              hover:text-cyan-300
            "
          >
            🏠
          </Link>

          <div className="hidden md:flex items-center gap-3">

            <Link
              href={switchHref}
              className="
                rounded-xl
                border
                border-sky-500/60
                bg-sky-500/10
                px-4
                py-2
                text-sm
                font-semibold
                text-sky-200
                transition-all
                duration-300
                hover:bg-sky-500/20
                hover:text-white
              "
            >
              {locale === "uk" ? "EN" : "UK"}
            </Link>

          </div>

          <div className="hidden md:flex items-center gap-8">

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
              className="
                rounded-xl
                p-2
                transition-all
                duration-300
                hover:bg-white/10
              "
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >                {open ? (
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
        <div
          className="
            md:hidden
            rounded-b-2xl
            border-t
            border-white/10
            bg-slate-900/95
            backdrop-blur-md
            px-3
            pt-3
            pb-4
            space-y-2
          "
        >
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
            onClick={() => setOpen(false)}
            className="
              flex
              items-center
              rounded-xl
              border
              border-sky-500/50
              bg-sky-500/10
              px-4
              py-2
              text-sm
              font-semibold
              text-sky-200
              transition-all
              duration-300
              hover:bg-sky-500/20
              hover:text-white
            "
          >
            🌐 {locale === "uk" ? "English" : "Українська"}
          </Link>
        </div>
      )}
    </nav>
  );
}