import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  mongoose.connection.on("error", (error) => console.error("MongoDB error", error));
  await mongoose.connect(env.MONGODB_URI);
  console.log("MongoDB connected");
}
