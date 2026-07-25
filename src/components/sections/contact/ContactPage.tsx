import Hero from "./Hero";

type Props = {
  locale: string;
};

export default function ContactPage({ locale }: Props) {
  return (
    <main className="p-6">
      <Hero locale={locale} />
    </main>
  );
}