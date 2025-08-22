"use client";
import { useEffect, useRef } from "react";

export default function ChuhChuh() {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(() => {
                console.log("Користувач має натиснути, щоб звук пішов");
            });
        }
    }, []);

    return (
        <div className="relative w-full h-32 overflow-hidden">
            {/* Поїзд */}
            <div className="absolute left-0 bottom-0 animate-chuh">
                🚂💨 чух-чух-чух ту-ту!
            </div>

            {/* Звук */}
            <audio ref={audioRef} loop>
                <source src="/sounds/chuh-chuh.mp3" type="audio/mpeg" />
            </audio>

            <style jsx>{`
        .animate-chuh {
          animation: ride 8s linear infinite;
          font-size: 2rem;
        }
        @keyframes ride {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100vw);
          }
        }
      `}</style>
        </div>
    );
}
