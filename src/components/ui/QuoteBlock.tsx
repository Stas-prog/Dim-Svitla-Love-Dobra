import { getMessages } from "@/lib/i18n";

type Props = {
  locale: string;
};

export default function QuoteBlock({ locale }: Props) {
  const t = getMessages(locale);

  return (
    <section className="pt-10 pb-6">
      <div className="mx-auto max-w-4xl text-center">

        <div
          className="
            mx-auto
            mb-10
            h-px
            w-24
            rounded-full
            bg-gradient-to-r
            from-transparent
            via-amber-400
            to-transparent
          "
        />

        <p
          className="
            text-4xl
            font-black
            leading-[1.7]
            tracking-tight
            text-amber-900
            sm:text-5xl
            lg:text-6xl
          "
        >
          {t.quote.line1}
          <br />
          {t.quote.line2}
          <br />
          {t.quote.line3}
        </p>

        <div
          className="
            mx-auto
            mt-10
            h-px
            w-24
            rounded-full
            bg-gradient-to-r
            from-transparent
            via-amber-400
            to-transparent
          "
        />

      </div>
    </section>
  );
}