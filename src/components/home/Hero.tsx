import Image from "next/image";

type Props = {
  dict: {
    home: {
      hero: {
        title: string;
        subtitle: string;
      };
    };
  };
};

export default function Hero({ dict }: Props) {
  return (
    <section className="mb-14">
      <div
        className="
          rounded-[2rem]
          bg-white/70
          backdrop-blur-md
          shadow-2xl
          text-center
          px-6
          py-10
          sm:px-8
          md:px-10
          lg:px-16
          md:py-14
        "
      >
        <div className="mb-5 flex justify-center">
          <div className="rounded-full bg-pink-200 p-4 shadow-lg">
            ❤️
          </div>
        </div>

        <h1
          className="
            font-extrabold
            text-blue-900
            leading-tight
            text-4xl
            sm:text-5xl
            lg:text-6xl
          "
        >
          {dict.home.hero.title}
        </h1>

        <p
          className="
            mt-8
            mx-auto
            max-w-4xl
            px-2
            text-lg
            sm:text-xl
            leading-9
            md:leading-10
            text-green-600
          "
        >
          {dict.home.hero.subtitle}
        </p>

        <div className="mt-10 flex justify-center">
          <Image
            src="/inter2.jpg"
            alt="Children of the world"
            width={624}
            height={312}
            priority
            className="
              w-full
              max-w-2xl
              rounded-3xl
              shadow-2xl
            "
          />
        </div>
      </div>
    </section>
  );
}