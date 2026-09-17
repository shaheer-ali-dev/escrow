import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  authProvider: "local" | "google" | "both";
  emailVerified: boolean;
  avatarUrl?: string;
};

export function serializeUser(user: { id: string; email: string; name: string; authProvider: "local" | "google" | "both"; emailVerified: boolean; avatarUrl?: string }): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    authProvider: user.authProvider,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
  };
}

export function issueToken(user: { id: string; email: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
}

export async function signupService(input: unknown) {
  const data = signupSchema.parse(input);
  const email = data.email.toLowerCase();

  const existing = await User.exists({ email });
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({
    email,
    name: data.name,
    passwordHash,
    authProvider: "local",
    emailVerified: false,
  });

  return {
    user: serializeUser(user as any),
    token: issueToken(user as any),
  };
}

export async function loginService(input: unknown) {
  const data = loginSchema.parse(input);
  const email = data.email.toLowerCase();

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  return {
    user: serializeUser(user as any),
    token: issueToken(user as any),
  };
}
