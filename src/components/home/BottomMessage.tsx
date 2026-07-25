
type Props = {
  dict: {
    home: {
      bottom: {
        text: string;
        };
    };
  };
};

export default function BottomMessage({ dict }: Props) {
  return (
    <section className="py-16 text-center">
      <div className="mx-auto max-w-xl">

        <div className="mb-6 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

        <p className="text-lg text-slate-500 tracking-wide">
          {dict.home.bottom.text}
        </p>

        <div className="mt-3 text-2xl">
          ❤️🌞
        </div>

      </div>
    </section>
  );
}