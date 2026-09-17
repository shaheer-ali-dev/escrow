import mongoose from "mongoose";
import { env } from "./env.js";
export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("MongoDB connected");
}
process.on("SIGINT", async () => { await mongoose.disconnect(); process.exit(0); });
process.on("SIGTERM", async () => { await mongoose.disconnect(); process.exit(0); });
