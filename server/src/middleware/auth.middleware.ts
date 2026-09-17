import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";

declare global { namespace Express { interface User { id: string; email: string; name: string; } } }

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { sub: string };
    const user = await User.findById(payload.sub).select("email name");
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch { res.status(401).json({ error: "Invalid or expired token" }); }
}
