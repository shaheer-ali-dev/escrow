import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserDoc } from "../models/user.model.js";

export function issueToken(user: UserDoc) {
  const userId = user._id.toString();
  return jwt.sign({ sub: userId, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string };
  } catch {
    return null;
  }
}