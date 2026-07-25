import Hero from "./Hero";
import MissionValues from "./MissionValues";
import QuoteBlock from "@/components/ui/QuoteBlock";
import PageContainer from "@/components/ui/PageContainer";

import { getMessages } from "@/lib/i18n";

type Props = {
  locale: string;
};

export default function MissionPage({ locale }: Props) {
  const t = getMessages(locale);

  return (
    <>
      <Hero t={t} />

      <PageContainer className="max-w-5xl pt-6 pb-10">
      <MissionValues locale={locale} />
      <QuoteBlock locale={locale}/>
      </PageContainer>
    </>
  );
}