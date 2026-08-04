import AssistantChat from "@/components/assistant/chat/AssistantChat";

import { getMessages } from "@/messages";

type Props = {
    params: Promise<{
        locale: "uk" | "en";
    }>;
};

export default async function AssistantPage({
    params,
}: Props) {

    const { locale } = await params;

    const t = await getMessages(locale);

    return (

        <main className="mx-auto max-w-5xl py-12">

            <div
                className="
                    rounded-3xl
                    border
                    border-sky-500/20
                    bg-slate-900
                    p-10
                    shadow-2xl
                "
            >

                <h1 className="text-4xl font-bold text-sky-300">
                    {t.assistantChat.title}
                </h1>

                <p className="mt-6 mb-8 text-slate-300 leading-8">
                    {t.assistantChat.description}
                </p>

                <AssistantChat
                    locale={locale}
                    t= {t}
                />

            </div>

        </main>

    );

}