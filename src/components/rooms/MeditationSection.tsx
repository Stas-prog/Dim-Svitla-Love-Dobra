import { Link } from "lucide-react";

type MeditationLink = {
  label: string;
  url: string;
};

type Props = {
  title: string;
  description?: string;
  note?: string;
  links: MeditationLink[];
};

export default function MeditationSection({
  title,
  description,
  note,
  links,
}: Props) {
  return (
    <section className="mt-4 rounded-xl border border-slate-700 bg-slate-800 p-5">
      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      {description && (
        <p className="mt-2 whitespace-pre-line text-slate-300">
          {description}
        </p>
      )}

      {note && (
        <div className="mt-3 inline-flex rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
          {note}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
          >
            {link.label}
            <Link size={16} />
          </a>
        ))}
      </div>
    </section>
  );
}