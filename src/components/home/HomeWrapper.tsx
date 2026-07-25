import HomeContent from "./HomeContent";

type Props = {
  locale: string;
};

export default function HomeWrapper({
  locale,
}: Props) {
  return (
    <main
      className="
        relative
        mx-auto
        w-full
        max-w-6xl
        px-4
        sm:px-6
        lg:px-8
        py-10
        md:py-14
      "
    >
      <HomeContent locale={locale} />
    </main>
  );
}