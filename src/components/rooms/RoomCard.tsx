import { ExternalLink } from "lucide-react";

type Props = {
  icon: string;
  title: string;
  description: string;
  url: string;
  buttonLabel: string;
};

export default function RoomCard({
  icon,
  title,
  description,
  url,
  buttonLabel,
}: Props) {
  return (
    <div
      className="
        rounded-xl
        border
        border-slate-700
        bg-slate-800
        p-5
        transition-all
        duration-300
        hover:border-sky-400
        hover:shadow-xl
        hover:-translate-y-1
      "
    >
      <h2 className="text-xl font-semibold">
        {icon} {title}
      </h2>

      <p className="mt-2 text-slate-300">
        {description}
      </p>

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="
          mt-4
          inline-flex
          items-center
          gap-2
          rounded-lg
          bg-sky-600
          px-4
          py-2
          font-semibold
          transition-colors
          hover:bg-sky-500
        "
      >
        {buttonLabel}
        <ExternalLink size={16} />
      </a>
    </div>
  );
}