import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/user.model.js";
import { tokenFor, safeUser } from "../utils/auth.js";
import type { Request, Response } from "express";
const signup = z.object({ email: z.string().email(), password: z.string().min(8).max(128), name: z.string().trim().min(1).max(120) });
const login = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function signupUser(req: Request, res: Response) { const input = signup.parse(req.body); const email = input.email.toLowerCase(); if (await User.exists({ email })) return res.status(409).json({ error: "Email is already registered" }); const user = await User.create({ email, name: input.name, passwordHash: await bcrypt.hash(input.password, 12), authProvider: "local" }); return res.status(201).json({ user: safeUser(user), token: tokenFor(user as UserDocWithId) }); }
export async function loginUser(req: Request, res: Response) { const input = login.parse(req.body); const user = await User.findOne({ email: input.email.toLowerCase() }).select("+passwordHash"); if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: "Invalid email or password" }); return res.json({ user: safeUser(user), token: tokenFor(user as UserDocWithId) }); }
type UserDocWithId = import("../models/user.model.js").UserDoc & { id: string };
