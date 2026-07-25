import Doors from "@/components/navigation/Doors";
import HomeWrapper from "@/components/home/HomeWrapper";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function Page({
  params,
}: Props) {

  const { locale } = await params;

  return (
    <>
     <Doors />
     <HomeWrapper locale={locale} />
    </>
  );
}