import mongoose, { Schema } from "mongoose";

export interface UserDoc {
  email: string;
  passwordHash?: string;
  name: string;
  googleId?: string;
  avatarUrl?: string;
  authProvider: "local" | "google" | "both";
  emailVerified: boolean;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    googleId: { type: String, unique: true, sparse: true, index: true },
    avatarUrl: String,
    authProvider: { type: String, enum: ["local", "google", "both"], default: "local" },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDoc>("User", userSchema);
