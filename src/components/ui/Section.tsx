import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Section({
  children,
  className = "",
}: Props) {
  return (
    <section
      className={`
        space-y-10
        sm:space-y-12
        ${className}
      `}
    >
      {children}
    </section>
  );
}