import mongoose from "mongoose";
import "@/models/register";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not configured");

const globalForMongoose = global as typeof globalThis & { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } };
const cached = globalForMongoose.mongoose ?? { conn: null, promise: null };
globalForMongoose.mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.promise ??= mongoose.connect(uri!, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}
