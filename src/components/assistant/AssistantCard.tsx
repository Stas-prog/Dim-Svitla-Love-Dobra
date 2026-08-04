type Props = {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
};

export default function AssistantCard({
  icon,
  title,
  description,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="
        group
        w-full
        rounded-3xl
        border
        border-sky-500/20
        bg-slate-800/70
        backdrop-blur-md
        p-6
        text-left
        shadow-xl
        transition-all
        duration-300
        hover:-translate-y-2
        hover:border-sky-400
        hover:shadow-sky-500/20
      "
    >
      <div className="mb-4 text-5xl">
        {icon}
      </div>

      <h2
        className="
          text-2xl
          font-bold
          text-sky-300
          transition-colors
          group-hover:text-sky-200
        "
      >
        {title}
      </h2>

      <p
        className="
          mt-4
          leading-7
          text-slate-300
        "
      >
        {description}
      </p>

      <div
        className="
          mt-6
          text-sky-400
          font-semibold
          transition-transform
          duration-300
          group-hover:translate-x-2
        "
      >
        →
      </div>
    </button>
  );
}