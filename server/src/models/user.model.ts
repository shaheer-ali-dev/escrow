import mongoose, { Schema, Document, Types } from "mongoose";

export interface UserDoc extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  passwordHash?: string;
  authProvider: "local" | "google" | "both";
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    passwordHash: String,
    authProvider: { type: String, enum: ["local", "google", "both"], default: "local" },
    emailVerified: { type: Boolean, default: false },
    avatarUrl: String,
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDoc>("User", userSchema);