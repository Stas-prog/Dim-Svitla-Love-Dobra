import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function PageTitle({
  children,
  className = "",
}: Props) {
  return (
    <h1
      className={`
        text-center

        text-4xl
        sm:text-5xl
        lg:text-6xl

        font-extrabold

        leading-tight
        tracking-tight

        text-slate-900

        ${className}
      `}
    >
      {children}
    </h1>
  );
}