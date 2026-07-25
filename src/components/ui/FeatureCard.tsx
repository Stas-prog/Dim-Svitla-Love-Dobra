type Props = {
  icon: React.ReactNode;
  title: React.ReactNode;
  text: React.ReactNode;
};

export default function FeatureCard({
  icon,
  title,
  text,
}: Props) {
  return (
    <article
      className="
        h-full
        rounded-3xl
        bg-white/75
        backdrop-blur-md
        border border-white/50
        shadow-lg

        p-8
        sm:p-10

        transition-all
        duration-300

        hover:-translate-y-1
        hover:shadow-2xl
      "
    >
      <div className="text-5xl">
        {icon}
      </div>

      <h3 className="mt-6 text-3xl font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-5 text-lg leading-8 text-slate-700">
        {text}
      </p>
    </article>
  );
}