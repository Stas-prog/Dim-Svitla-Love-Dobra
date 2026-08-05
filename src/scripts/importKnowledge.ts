// import { getDb } from "@/lib/mongo";
// import { HOUSE_KNOWLEDGE } from "@/lib/houseBrain/knowledgeSeed";
// import dotenv from "dotenv";

// dotenv.config({
//     path: ".env.local",
// });

// async function run() {

//     const db = await getDb();

//     const collection = db.collection("knowledge");

//     await collection.deleteMany({});

//     await collection.insertMany(HOUSE_KNOWLEDGE);

//     console.log(`Imported ${HOUSE_KNOWLEDGE.length} knowledge documents.`);

//     process.exit(0);
// }

// run().catch(console.error);