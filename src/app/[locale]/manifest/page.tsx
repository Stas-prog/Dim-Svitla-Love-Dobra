import ManifestPage from "@/components/sections/manifest/ManifestPage";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { locale } = await params;

  return <ManifestPage locale={locale} />;
}