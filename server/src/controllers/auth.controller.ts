import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import passport from "passport";
import { User } from "../models/user.model.js";
import { signAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

const signupSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128), name: z.string().trim().min(1).max(120) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
function publicUser(user: { id: string; email: string; name: string; authProvider: string; emailVerified: boolean; avatarUrl?: string }) { return { id: user.id, email: user.email, name: user.name, authProvider: user.authProvider, emailVerified: user.emailVerified, avatarUrl: user.avatarUrl }; }

export async function signup(req: Request, res: Response) {
  const input = signupSchema.parse(req.body);
  const email = input.email.toLowerCase();
  if (await User.exists({ email })) return res.status(409).json({ error: "Email is already registered" });
  const user = await User.create({ email, name: input.name, passwordHash: await bcrypt.hash(input.password, 12), authProvider: "local", emailVerified: false });
  return res.status(201).json({ user: publicUser(user), token: signAccessToken(user) });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+passwordHash");
  if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: "Invalid email or password" });
  return res.json({ user: publicUser(user), token: signAccessToken(user) });
}

export function googleStart(req: Request, res: Response, next: (error?: unknown) => void) {
  if (!env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: "Google OAuth is not configured" });
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
}
export function googleCallback(req: Request, res: Response, next: (error?: unknown) => void) {
  passport.authenticate("google", { session: false }, (error: Error | null, user: any) => { if (error || !user) return res.status(401).json({ error: "Google authentication failed" }); res.json({ user: publicUser(user), token: signAccessToken(user) }); })(req, res, next);
}
