type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function PageContainer({
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`
        mx-auto
        w-full
        max-w-7xl

        px-5
        sm:px-8
        lg:px-12

        py-4
        sm:py-6
        lg:py-8

        ${className}
      `}
    >
      {children}
    </div>
  );
}