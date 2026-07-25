import MissionPage from "@/components/sections/mission/MissionPage";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { locale } = await params;

  return <MissionPage locale={locale} />;
}