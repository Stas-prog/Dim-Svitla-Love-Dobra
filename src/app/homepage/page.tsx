import HousePanel from "@/components/HousePanel";
import Guestbook from "@/components/Guestbook";

export default function HomePage() {
    return (
        <main className="p-4 space-y-6">
            <HousePanel />
            <Guestbook />
        </main>
    );
}
