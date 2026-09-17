import { User } from "../models/user.model.js";
import { tokenFor, safeUser } from "../utils/auth.js";
export { tokenFor, safeUser };
export async function findOrCreateUserFromGoogle(input: { googleId: string; email: string; name: string; avatarUrl?: string }) { return User.findOneAndUpdate({ $or: [{ googleId: input.googleId }, { email: input.email }] }, { $set: { googleId: input.googleId, email: input.email, name: input.name, avatarUrl: input.avatarUrl, emailVerified: true }, $setOnInsert: { authProvider: "google" } }, { new: true, upsert: true, setDefaultsOnInsert: true }); }
