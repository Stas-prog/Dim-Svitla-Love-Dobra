import ContactPage from "@/components/sections/contact/ContactPage";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { locale } = await params;

  return <ContactPage locale={locale} />;
}