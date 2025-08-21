import Navbar from "@/components/Navbar";

export default function ContactPage() {
    return (
        <div>
            <Navbar />
            <main className="p-6">
                <h1 className="text-2xl font-bold mb-4">📬 Контакти</h1>
                <p>
                    Напиши нам, і ми обов’язково відповімо 💌
                    Email: <a href="mailto:light@vision.org" className="text-sky-400 underline">light@vision.org</a>
                </p>
            </main>
        </div>
    );
}
