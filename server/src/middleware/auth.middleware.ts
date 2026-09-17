import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; email: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string }; 
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.auth = { userId: user.id, email: user.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
