import Badge from "@/components/ui/Badge";
import PageContainer from "@/components/ui/PageContainer";

type Props = {
  t: {
    hero: {
      badge: string;
      title: string;
      subtitle: string;
      motto: string;
    };
  };
};

export default function Hero({ t }: Props) {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <PageContainer>
        <div className="mx-auto max-w-5xl text-center">
          <Badge>{t.hero.badge}</Badge>

          <h1
            className="
              mt-8

              whitespace-pre-line

              text-5xl
              sm:text-6xl
              md:text-7xl
              xl:text-8xl

              font-black

              leading-[0.92]
              tracking-tight

              text-slate-900
            "
          >
            {t.hero.title}
          </h1>

          <p
            className="
              mx-auto
              mt-8

              max-w-4xl

              text-lg
              sm:text-xl
              lg:text-2xl

              leading-8
              lg:leading-10

              text-slate-700
            "
          >
            {t.hero.subtitle}
          </p>

          <p
            className="
              mx-auto
              mt-8

              max-w-3xl

              whitespace-pre-line

              text-lg
              sm:text-xl

              leading-8

              font-medium

              text-green-600
            "
          >
            {t.hero.motto}
          </p>
        </div>
      </PageContainer>
    </section>
  );
}