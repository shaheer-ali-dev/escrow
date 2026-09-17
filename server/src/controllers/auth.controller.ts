import type { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/user.model.js";
import { issueToken, serializeUser } from "../services/auth.service.js";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signupUser(req: Request, res: Response) {
  try {
    const payload = signupSchema.parse(req.body);
    const email = payload.email.toLowerCase();

    const exists = await User.exists({ email });
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await User.create({
      email,
      name: payload.name,
      passwordHash: (await import("bcryptjs")).default.hashSync(payload.password, 12),
      authProvider: "local",
      emailVerified: false,
    });

    return res.status(201).json({
      user: serializeUser(user as any),
      token: issueToken(user as any),
    });
  } catch (error) {
    throw error;
  }
}

export async function loginUser(req: Request, res: Response) {
  const payload = loginSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const bcrypt = await import("bcryptjs");
  const isValid = await bcrypt.default.compare(payload.password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  return res.json({
    user: serializeUser(user as any),
    token: issueToken(user as any),
  });
}
