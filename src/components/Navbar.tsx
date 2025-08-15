
export default function Navbar() {
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white/30 backdrop-blur-sm shadow-soft">
            <h1 className="text-xl font-semibold tracking-tight text-slate-800 drop-shadow-sm">
                Дім Світла
            </h1>
            <nav className="flex gap-6 text-slate-700 font-medium">
                <a href="#about" className="hover:text-amber-600 transition">Про нас</a>
                <a href="#mission" className="hover:text-amber-600 transition">Місія</a>
                <a href="#contact" className="hover:text-amber-600 transition">Контакти</a>
                <a href="/homepage" className="hover:text-amber-600 transition">Вітальня</a>
            </nav>
        </header>
    );
}
