"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChuhChuhButton() {
    const [active, setActive] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleClick = () => {
        setActive(true);

        // створюємо або використовуємо існуючий аудіо-об’єкт
        if (!audioRef.current) {
            audioRef.current = new Audio("/sounds/chuh-chuh-cartoon.mp3");
            audioRef.current.loop = true; // повторювати звук
        }
        audioRef.current.currentTime = 0; // починати з початку
        audioRef.current.play();

        // вимикаємо через 4 сек
        setTimeout(() => {
            setActive(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }, 4000);
    };

    return (
        <div className="relative z-50 flex flex-col items-center mt-8">
            <button
                onClick={handleClick}
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-full shadow-lg hover:bg-emerald-700 transition"
            >
                🚂 Чух-Чух
            </button>

            <AnimatePresence>
                {active && (
                    <motion.div
                        key="train"
                        className="absolute top-[-50px] left-0 text-4xl"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 4, ease: "linear" }}
                    >
                        🚂💨
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
