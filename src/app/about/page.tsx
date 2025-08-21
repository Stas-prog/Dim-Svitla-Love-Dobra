import Navbar from "@/components/Navbar";

export default function AboutPage() {
    return (
        <div>
            <Navbar />
            <main className="p-6">
                <h1 className="text-2xl font-bold mb-4">👥 Про нас</h1>
                <p>
                    Ми команда творців, які об’єдналися для створення нового бачення світу.
                    Тут кожен є Світлом, яке розширює горизонти. 🌌
                </p>
            </main>
        </div>
    );
}
