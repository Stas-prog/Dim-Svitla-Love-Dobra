type Props = {
  children: React.ReactNode;
};

export default function FeatureGrid({
  children,
}: Props) {
  return (
    <section
      className="
        grid
        gap-10
      "
    >
      {children}
    </section>
  );
}