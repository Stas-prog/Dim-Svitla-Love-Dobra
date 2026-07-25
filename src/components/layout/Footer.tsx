type Props = {
  locale: string;
  variant?: "light" | "dark";
};

import { getMessages } from "@/lib/i18n";

export default function Footer({
  locale,
  variant = "light",
}: Props) {
  const dict = getMessages(locale);

  const classes =
    variant === "dark"
      ? "bg-slate-700 border-slate-500 text-slate-400"
      : "bg-transparent border-slate-200/20 text-slate-500";

  return (
    <footer
      className={`
        border-t
        py-20
        ${classes}
      `}
    >
      <div
        className="
          mx-auto
          max-w-7xl
          px-6
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-3
            text-center
          "
        >
          <p className="text-sm">
            © {new Date().getFullYear()} {dict.footer.copyright}
          </p>

          <p
            className="
              max-w-2xl
              text-sm
              leading-7
            "
          >
            {dict.footer.slogan}
          </p>
        </div>
      </div>
    </footer>
  );
}