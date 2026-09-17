import { z } from "zod";
import type { Request, Response } from "express";
import { Profile } from "../models/profile.model.js";

const profileSchema = z.object({
  bio: z.string().max(2000).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  portfolioUrls: z.array(z.string().url()).max(20).optional(),
});

export async function getProfileService(userId: string) {
  return Profile.findOne({ userId }).lean();
}

export async function updateProfileService(userId: string, input: unknown) {
  const payload = profileSchema.parse(input);

  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: payload, $setOnInsert: { userId } },
    { new: true, upsert: true, runValidators: true }
  );

  return profile;
}

export async function getProfileHandler(req: Request, res: Response) {
  const profile = await getProfileService(req.auth!.userId);
  return res.json({ profile });
}

export async function updateProfileHandler(req: Request, res: Response) {
  const profile = await updateProfileService(req.auth!.userId, req.body);
  return res.json({ profile });
}
