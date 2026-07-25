import { getMessages } from "@/lib/i18n";

type Props = {
  locale: string;
};

export default function MissionValues({ locale }: Props) {
  const t = getMessages(locale);

  const values = [
    {
      icon: "🤝",
      ...t.missionValues.unity,
    },
    {
      icon: "❤️",
      ...t.missionValues.love,
    },
    {
      icon: "🕊️",
      ...t.missionValues.peace,
    },
  ];

  return (
    <section className="mx-auto max-w-5xl">
      <div
        className="
          overflow-hidden

          rounded-[48px]

          bg-white/70
          backdrop-blur-xl

          shadow-2xl
        "
      >
        {values.map((value, index) => (
          <article
            key={value.title}
            className={`
              px-10
              py-10

              md:px-14
              md:py-12

              ${
                index !== values.length - 1
                  ? "border-b border-slate-200/60"
                  : ""
              }
            `}
          >
            <div className="flex items-start gap-7">
              <div
                className="
                  mt-1
                  text-4xl
                  leading-none
                "
              >
                {value.icon}
              </div>

              <div className="flex-1">
                <h2
                  className="
                    text-4xl
                    font-black
                    tracking-tight
                    text-slate-900
                  "
                >
                  {value.title}
                </h2>

                <p
                  className="
                    mt-6

                    text-xl
                    leading-9

                    text-slate-700
                  "
                >
                  {value.text}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}