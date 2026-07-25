"use client";

import { createContext, useContext } from "react";

export type Offset = {
  x: number;
  y: number;
};

export const ParallaxCtx = createContext<Offset>({
  x: 0,
  y: 0,
});

export function useParallax() {
  return useContext(ParallaxCtx);
}