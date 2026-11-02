import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
// Keeping build-time imports side-effect free lets CI compile before Vercel secrets are set.
// Any database request still requires a real MONGODB_URI.
const globalForMongo = globalThis as typeof globalThis & { mongoClient?: MongoClient };
const client = globalForMongo.mongoClient ?? new MongoClient(uri || "mongodb://127.0.0.1:27017/dayward");
if (process.env.NODE_ENV !== "production") globalForMongo.mongoClient = client;
export const mongo = client;
export const db = client.db(process.env.MONGODB_DB || "dayward");

