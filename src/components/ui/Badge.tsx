type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function Badge({
  children,
  className = "",
}: Props) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2

        rounded-full

        border
        border-amber-300/80

        bg-white/50
        backdrop-blur-sm

        px-5
        py-2

        sm:px-6

        text-xs
        sm:text-sm

        font-semibold
        uppercase
        tracking-[0.25em]

        text-amber-700

        shadow-sm

        ${className}
      `}
    >
      {children}
    </span>
  );
}