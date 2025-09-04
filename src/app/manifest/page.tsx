"use client";

import { motion } from "framer-motion";


const lines = [
    "Ми — світло серед темряви.",
    "Ми обираємо Любов замість ненависті,",
    "Добро замість зла,",
    "Творіння замість руйнування.",
    "",
    "Наш дім — відкритий.",
    "У ньому є місце для кожного,",
    "Хто прагне миру, правди й тепла.",
    "",
    "Ми стоїмо разом.",
    "Як промінь сонця пробиває хмари,",
    "Так і ми пробиваємо хаос —",
    "Чистотою серця і силою духу.",
    "",
    "Ми — Дім Світла.",
    "Тут Любов — це закон,",
    "А Добро — це мова Всесвіту.",
];

export default function ManifestPage() {
   

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-slate-900 to-emerald-900 text-white font-serif p-6 overflow-hidden">
            <div className="max-w-2xl text-center space-y-3">
                {lines.map((line, i) => (
                    <motion.p
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.6, duration: 0.8 }}
                        className="text-lg md:text-xl"
                    >
                        {line.includes("Світло") ||
                            line.includes("Любов") ||
                            line.includes("Добро") ? (
                            <motion.span
                                animate={{
                                    scale: [1, 1.1, 1],
                                    color: ["#fff", "#facc15", "#fff"],
                                }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="font-bold"
                            >
                                {line}
                            </motion.span>
                        ) : (
                            line
                        )}
                    </motion.p>
                ))}

                <motion.h1
                    className="mt-10 text-3xl md:text-4xl font-bold text-emerald-300"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: lines.length * 0.6, duration: 1 }}
                >
                    Дім Світла, Любові і Добра
                </motion.h1>
            </div>
        </div>
    );
}


     