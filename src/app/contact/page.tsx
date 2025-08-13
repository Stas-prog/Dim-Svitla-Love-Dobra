export default function ContactPage() {
    return (
        <div className="py-12 space-y-6">
            <h1 className="text-3xl font-bold">Контакти</h1>
            <p className="text-zinc-300">
                Пиши нам світло і прямо в серце. Ми поруч. ✉️
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <p className="text-zinc-300">
                    Email: <a className="underline hover:text-amber-300" href="mailto:light@dim-svitla.example">light@dim-svitla.example</a>
                </p>
                <p className="text-zinc-300">
                    Телеграм: <span className="opacity-80">@dim_svitla</span>
                </p>
            </div>
        </div>
    )
}
