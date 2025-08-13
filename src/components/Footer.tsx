export default function Footer() {
    return (
        <footer className="mt-16 border-t border-white/10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-zinc-400">
                <div>© {new Date().getFullYear()} Дім Світла, Любові і Добра</div>
                <div className="opacity-80">З теплом. Разом до Світла. 🌟</div>
            </div>
        </footer>
    )
}
