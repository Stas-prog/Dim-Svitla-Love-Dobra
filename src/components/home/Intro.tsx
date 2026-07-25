import Link from "next/link";
import Unity from "./Unity";

type Props = {
  locale: string;
  dict: {
    home: {
      intro: {
        title: string;
        text: string;
        button: string;
      };
      unity: {
        title: string;
      };
    };
  };
};

export default function Intro({
  dict,
  locale,
}: Props) {
  return (
    <section
      className="
        rounded-3xl
        bg-white/5
        ring-1
        ring-white/10
        p-5
        sm:p-8
        lg:p-12
      "
    >
      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-10
          lg:gap-14
          items-center
        "
      >
        <div className="text-center lg:text-left">
          <h2
            className="
              font-bold
              leading-tight
              text-red-600
              text-4xl
              sm:text-5xl
            "
            style={{ whiteSpace: "pre-line" }}
          >
            {dict.home.intro.title}
          </h2>

          <p
            className="
              mt-8
              text-lg
              sm:text-xl
              leading-9
              md:leading-10
              text-violet-700
            "
          >
            {dict.home.intro.text}
          </p>

          <div
            className="
              mt-10
              flex
              justify-center
              lg:justify-start
            "
          >
            <Link
              href={`/${locale}/about`}
              className="
                rounded-full
                border-2
                border-blue-500
                bg-green-500
                px-8
                py-4
                font-semibold
                text-white
                transition
                hover:bg-green-400
              "
            >
              {dict.home.intro.button}
            </Link>
          </div>
        </div>

        <Unity dict={dict} />
      </div>
    </section>
  );
}