import Hero from "./Hero";
import Intro from "./Intro";
import BottomMessage from "./BottomMessage";

import { getMessages } from "@/lib/i18n";

type Props = {
  locale: string;
};

export default function HomeContent({
  locale,
}: Props) {
  const dict = getMessages(locale);

  return (
    <div
      className="
        relative
        rounded-2xl
        bg-white/60
        backdrop-blur-md
        shadow-soft
        p-4
        sm:p-6
        md:p-8
      "
    >
      <Hero dict={dict} />

      <div
        className="
          mx-auto
          w-full
          px-2
          sm:px-4
          md:px-6
          py-10
          md:py-16
        "
      >
        <Intro
          dict={dict}
          locale={locale}
        />

        <div className="relative">
          <div
            className="
              absolute
              left-1/2
              bottom-0
              -translate-x-1/2
              h-40
              w-[500px]
              rounded-full
              bg-yellow-200/20
              blur-3xl
              pointer-events-none
            "
          />

          <BottomMessage />
        </div>
      </div>
    </div>
  );
}