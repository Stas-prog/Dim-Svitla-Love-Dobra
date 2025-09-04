import { MongoClient } from "mongodb";

const MONGO = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DB;

(async () => {
  const cx = await MongoClient.connect(MONGO);
  const db = cx.db(DB);

  // зі snaps (image as dataURL)
  const snaps = await db.collection("snaps").find().toArray();
  if (snaps.length) {
    const docs = snaps.map(s => ({
      roomId: s.roomId || "migrated-snaps",
      by: "migration",
      imageDataUrl: s.image,
      createdAt: (s.createdAt instanceof Date ? s.createdAt.toISOString() : new Date().toISOString())
    }));
    if (docs.length) {
      await db.collection("vision_snaps").insertMany(docs);
    }
  }

  // зі snapshots (binary -> dataURL)
  const shots = await db.collection("snapshots").find().toArray();
  if (shots.length) {
    const docs = shots.map(s => {
      const mime = s.mime || "image/jpeg";
      const base64 = s.data?.buffer ? Buffer.from(s.data.buffer).toString("base64") : "";
      const imageDataUrl = base64 ? `data:${mime};base64,${base64}` : "";
      return {
        roomId: s.roomId || "migrated-snapshots",
        by: s.clientId || "migration",
        imageDataUrl,
        createdAt: s.createdAt || new Date().toISOString(),
      };
    }).filter(d => d.imageDataUrl);
    if (docs.length) {
      await db.collection("vision_snaps").insertMany(docs);
    }
  }

  console.log("Migration done");
  await cx.close();
})();
