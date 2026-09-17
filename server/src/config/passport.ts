import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";
import { env } from "./env.js";

export function configurePassport() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return;
  passport.use(new GoogleStrategy({ clientID: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, callbackURL: env.GOOGLE_CALLBACK_URL }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) return done(new Error("Google account did not provide an email"));
      const user = await User.findOneAndUpdate(
        { $or: [{ googleId: profile.id }, { email }] },
        { $set: { googleId: profile.id, email, name: profile.displayName || profile.name?.givenName || "Google user", avatarUrl: profile.photos?.[0]?.value, emailVerified: true }, $setOnInsert: { authProvider: "google" } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      done(null, user);
    } catch (error) { done(error as Error); }
  }));
}
