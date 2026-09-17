import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import { env } from "../config/env.js";
import { issueToken, serializeUser } from "../services/auth.service.js";
export function googleStart(req: Request, res: Response, next: NextFunction) { if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return res.status(503).json({ error: "Google OAuth is not configured" }); return passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next); }
export function googleCallback(req: Request, res: Response, next: NextFunction) { return passport.authenticate("google", { session: false }, (error: Error | null, user: any) => { if (error || !user) return res.status(401).json({ error: "Google authentication failed" }); return res.json({ token: issueToken(user), user: serializeUser(user) }); })(req, res, next); }
