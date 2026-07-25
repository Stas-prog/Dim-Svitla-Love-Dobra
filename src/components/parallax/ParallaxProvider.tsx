"use client";

import { useEffect, useMemo, useState } from "react";
import { Offset, ParallaxCtx } from "./useParallax";

export  function ParallaxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [offset, setOffset] = useState<Offset>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;

      setOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", handleMove);
    };
  }, []);

  const value = useMemo(() => offset, [offset]);

  return (
    <ParallaxCtx.Provider value={value}>
      {children}
    </ParallaxCtx.Provider>
  );
}