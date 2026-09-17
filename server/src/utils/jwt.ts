import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserDoc } from "../models/user.model.js";

export function signAccessToken(user: UserDoc) {
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}
