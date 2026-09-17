import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
declare global { namespace Express { interface Request { auth?: { userId: string; email: string } } } }
export async function requireAuth(req: Request, res: Response, next: NextFunction) { try { const value = req.header("authorization"); if (!value?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" }); const payload = jwt.verify(value.slice(7), env.JWT_SECRET) as { sub: string; email: string }; const user = await User.findById(payload.sub); if (!user) return res.status(401).json({ error: "User not found" }); req.auth = { userId: user.id, email: user.email }; next(); } catch { return res.status(401).json({ error: "Invalid or expired token" }); } }
