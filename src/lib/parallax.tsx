"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Offset = { x: number; y: number };

const ParallaxCtx = createContext<Offset>({ x: 0, y: 0 });
export function useParallax() {
    return useContext(ParallaxCtx);
}

export function ParallaxProvider({ children }: { children: React.ReactNode }) {
    const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
    const [permissionAsked, setPermissionAsked] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    // Виявляємо iOS один раз на клієнті
    useEffect(() => {
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
    }, []);

    // Обробники винесені на рівень компонента — тепер вони доступні і в useEffect, і в requestGyro
    const handleMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * 10;
        setOffset({ x, y });
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
        const x = (e.gamma ?? 0) / 5;
        const y = (e.beta ?? 0) / 5;
        setOffset({ x, y });
    };

    useEffect(() => {
        // На десктопі одразу вмикаємо мишу
        if (!isIOS) {
            window.addEventListener("mousemove", handleMove, { passive: true });
        }
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("deviceorientation", handleOrientation);
        };
        // isIOS у залежностях, щоб при зміні правильно перевісити слухачі
    }, [isIOS]);

    // Кнопка на iOS викликає цей запит (має бути після жесту користувача)
    const requestGyro = async () => {
        try {
            // @ts-expect-error — iOS Safari API
            if (DeviceOrientationEvent?.requestPermission) {
                // @ts-expect-error — iOS Safari API
                const perm = await DeviceOrientationEvent.requestPermission();
                if (perm === "granted") {
                    window.addEventListener("deviceorientation", handleOrientation);
                    setPermissionAsked(true);
                }
            } else {
                window.addEventListener("deviceorientation", handleOrientation);
                setPermissionAsked(true);
            }
        } catch (err) {
            console.error("Gyro permission error:", err);
        }
    };

    const value = useMemo(() => offset, [offset]);

    return (
        <ParallaxCtx.Provider value={value}>
            {isIOS && !permissionAsked && (
                <button
                    onClick={requestGyro}
                    aria-label="Увімкнути рух фону"
                    className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-amber-400 shadow-lg hover:bg-amber-300 transition"
                >
                    {/* Іконка компаса */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6 text-slate-900"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M12 3v1m0 16v1M21 12h1M2 12H1m8.464 3.536 4.243-1.415 1.415-4.243-4.243 1.415-1.415 4.243M19.071 4.929l-.707.707M4.929 19.071l.707-.707M19.071 19.071l-.707-.707M4.929 4.929l.707.707" />
                    </svg>
                </button>
            )}
            {children}
        </ParallaxCtx.Provider>
    );
}

/** Шар паралаксу. depth 0..1: менше = далі, рух слабший. */
export function ParallaxLayer({
    depth = 1,
    className,
    children,
}: {
    depth?: number;
    className?: string;
    children?: React.ReactNode;
}) {
    const { x, y } = useParallax();
    return (
        <div
            className={className}
            style={{
                transform: `translate(${x * depth}px, ${y * depth}px)`,
                transition: "transform 75ms ease-out",
                willChange: "transform",
            }}
        >
            {children}
        </div>
    );
}
