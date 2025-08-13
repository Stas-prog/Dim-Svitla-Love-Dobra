type Props = { title: string; emoji?: string; children?: React.ReactNode }

export default function GlowCard({ title, emoji, children }: Props) {
    return (
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 overflow-hidden">
            <div className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-white/10" />
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
            <h3 className="text-lg font-semibold">
                <span className="mr-2">{emoji}</span>{title}
            </h3>
            <div className="mt-2 text-sm text-zinc-300">{children}</div>
        </div>
    )
}
