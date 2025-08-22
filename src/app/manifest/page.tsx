"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Train } from "lucide-react";
import ChuhChuh from "@/components/ChuhChuh";
import ChuhChuhButton from "@/components/ChuhChuhButton";

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
    const [showTrain, setShowTrain] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // показуємо 🚂 після тексту
        const timer = setTimeout(() => setShowTrain(true), lines.length * 600 + 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (showTrain && audioRef.current) {
            audioRef.current.play().catch(() => {
                console.warn("Автовідтворення блокується браузером 🙃");
            });
        }
    }, [showTrain]);

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

            {/* 🚂 Анімація паровозика */}
            {showTrain && (
                <motion.div
                    className="absolute bottom-10 left-[-100px] flex items-center space-x-2 text-yellow-300 z-50"
                    initial={{ x: "-100%" }}
                    animate={{ x: "120vw" }}
                    transition={{ duration: 8, ease: "linear" }}
                >
                    <Train size={48} className="drop-shadow-lg" />
                    <p className="font-bold text-xl">Чух-Чух!</p>
                </motion.div>
            )}
            <ChuhChuh />
            <ChuhChuhButton />

            {/* 🎶 Аудіо паровозика */}
            <audio ref={audioRef} src="/sounds/train-chuh.mp3" preload="auto" />
        </div>
    );
}
