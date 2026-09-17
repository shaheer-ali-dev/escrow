import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserDoc } from "../models/user.model.js";
export function tokenFor(user: UserDoc & { id: string }) { return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }); }
export function safeUser(user: UserDoc & { id: string }) { return { id: user.id, email: user.email, name: user.name, authProvider: user.authProvider, emailVerified: user.emailVerified, avatarUrl: user.avatarUrl }; }
