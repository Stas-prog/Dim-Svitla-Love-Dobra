"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();

    const linkClass = (href: string) =>
        `hover:text-sky-400 transition ${pathname === href ? "text-sky-400 font-semibold" : "text-white"
        }`;

    return (
        <nav className="w-full bg-slate-900 text-white px-6 py-3 flex gap-6 items-center shadow-md">
            <Link href="/" className={linkClass("/")}>🏠 Home</Link>
            <Link href="/vision" className={linkClass("/vision")}>👁 Vision</Link>
            <Link href="/vision/rooms" className={linkClass("/vision/rooms")}>🗂 Rooms</Link>
            <Link href="/mission" className={linkClass("/mission")}>🌍 Місія</Link>
            <Link href="/about" className={linkClass("/about")}>👥 Про нас</Link>
            <Link href="/contact" className={linkClass("/contact")}>📬 Контакти</Link>
            <Link href="/snaps" className={linkClass("/snaps")}>📸 Snaps</Link>
        </nav>
    );
}
