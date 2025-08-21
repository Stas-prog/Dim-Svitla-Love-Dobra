import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

// Отримати всі фото
export async function GET() {
    const db = await getDb();
    const snaps = await db.collection("snaps").find().sort({ createdAt: -1 }).toArray();
    return NextResponse.json(snaps);
}

// Додати фото
export async function POST(req: Request) {
    try {
        const { roomId, image } = await req.json();

        if (!roomId || !image) {
            return NextResponse.json({ error: "roomId і image обов’язкові" }, { status: 400 });
        }

        const db = await getDb();
        const snaps = db.collection("snaps");
        const result = await snaps.insertOne({
            roomId,
            image,
            createdAt: new Date(),
        });

        return NextResponse.json({ insertedId: result.insertedId });
    } catch (err) {
        console.error("❌ Помилка у POST /api/snaps:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
