"use client";

import { useParallax } from "./useParallax";

type Props = {
  depth?: number;
  className?: string;
  children?: React.ReactNode;
};

export default function ParallaxLayer({
  depth = 1,
  className,
  children,
}: Props) {
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