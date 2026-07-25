import Image from "next/image";
import { getMessages } from "@/lib/i18n";

type Props = {
  locale: string;
};

export default function Hero({ locale }: Props) {
  const t = getMessages(locale);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">
        {t.contact.title}
      </h1>

      <p>
        {t.contact.text}

        <br />

        {t.contact.email}

        <a
          href="mailto:c-e21297@ukr.net"
          className="ml-2 text-sky-400 underline"
        >
          c-e21297@ukr.net
        </a>
      </p>

      <div className="mt-20 flex justify-center">
        <Image
          src="/love.png"
          alt="Love"
          width={1024}
          height={1024}
          priority
          className="
            w-full
            max-w-xl
            h-auto
            rounded-2xl
            shadow-2xl
          "
        />
      </div>
    </>
  );
}