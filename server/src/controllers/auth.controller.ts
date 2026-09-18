import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/user.model.js";
import { issueToken, serializeUser } from "../services/auth.service.js";

const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function signupUser(req: Request, res: Response) {
  const payload = signupSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  if (await User.exists({ email })) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const user = await User.create({
    email,
    name: payload.name,
    passwordHash: await bcrypt.hash(payload.password, 12),
    authProvider: "local",
    emailVerified: false,
  });

  return res.status(201).json({
    user: serializeUser(user),
    token: issueToken(user),
  });
}

export async function loginUser(req: Request, res: Response) {
  const payload = loginSchema.parse(req.body);
  const user = await User.findOne({ email: payload.email.toLowerCase() }).select("+passwordHash");

  if (!user?.passwordHash || !(await bcrypt.compare(payload.password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  return res.json({ user: serializeUser(user), token: issueToken(user) });
}
