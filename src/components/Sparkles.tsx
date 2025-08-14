"use client";

import { useEffect, useState } from "react";

type Dot = { left: string; top: string; size: string; dur: string; delay: string; blur: string };

export default function Sparkles({ count = 28 }: { count?: number }) {
    const [dots, setDots] = useState<Dot[] | null>(null);

    useEffect(() => {
        const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
        const make = (): Dot => ({
            left: `${rnd(3, 97).toFixed(4)}%`,
            top: `${rnd(5, 85).toFixed(4)}%`,
            size: `${rnd(2, 4).toFixed(2)}px`,
            dur: `${rnd(5, 10).toFixed(2)}s`,
            delay: `${rnd(0, 6).toFixed(2)}s`,
            blur: `${rnd(0, 2.5).toFixed(2)}px`,
        });
        setDots(Array.from({ length: count }, make));
    }, [count]);

    if (!dots) return null;

    return (
        <div aria-hidden className="pointer-events-none absolute inset-0">
            {dots.map((d, i) => (
                <div
                    key={i}
                    className="absolute rounded-full bg-white/90 animate-twinkle"
                    style={{
                        left: d.left,
                        top: d.top,
                        width: d.size,
                        height: d.size,
                        filter: `blur(${d.blur})`,
                        animationDuration: d.dur,
                        animationDelay: d.delay,
                    }}
                />
            ))}
        </div>
    );
}
