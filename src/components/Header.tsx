'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
    { href: '/', label: 'Головна' },
    { href: '/projects', label: 'Проєкти' },
    { href: '/trader', label: 'Трейдер' },
    { href: '/about', label: 'Про нас' },
    { href: '/contact', label: 'Контакти' },
    { href: '/homepage', label: 'Вітальня' },
    { href: '/observer', label: 'Спостерігач' },
]

export default function Header() {
    const pathname = usePathname()
    return (
        <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-[#06070a]/60 bg-[#06070a]/80 border-b border-white/10">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
                <Link href="/" className="font-extrabold tracking-tight">
                    Світлозір
                </Link>
                <nav className="flex gap-2">
                    {nav.map(i => (
                        <Link
                            key={i.href}
                            href={i.href}
                            className={`px-3 py-1 rounded-md text-sm transition ${pathname === i.href ? 'bg-white text-black' : 'hover:bg-white/10'
                                }`}
                        >
                            {i.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    )
}
