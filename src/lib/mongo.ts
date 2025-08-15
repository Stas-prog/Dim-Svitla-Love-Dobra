import { MongoClient } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;

export async function getDb() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    if (!clientPromise) clientPromise = new MongoClient(uri, {}).connect();
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB || "dim_svitla";
    return client.db(dbName);
}
