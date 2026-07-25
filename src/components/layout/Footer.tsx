type Props = {
  locale: string;
};

import { getMessages } from "@/lib/i18n";

export default function Footer({ locale }: Props) {
  const dict = getMessages(locale);

  return (
    <footer className="border-t border-white/10 py-10">

      <div className="mx-auto max-w-6xl px-6">

        <div className="space-y-2 text-sm text-slate-400">

          <p>
            © {new Date().getFullYear()} {dict.footer.copyright}
          </p>

          <p>
            {dict.footer.slogan}
          </p>

        </div>

      </div>

    </footer>
  );
}