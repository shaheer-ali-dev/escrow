import { z } from "zod";
import type { Request, Response } from "express";
import { Profile } from "../models/profile.model.js";
const profileSchema = z.object({ bio: z.string().max(2000).optional(), skills: z.array(z.string().trim().min(1).max(80)).max(30).optional(), portfolioUrls: z.array(z.string().url()).max(20).optional() });
export async function getProfile(req: Request, res: Response) { const profile = await Profile.findOne({ userId: req.auth!.userId }); return res.json({ profile }); }
export async function updateProfile(req: Request, res: Response) { const input = profileSchema.parse(req.body); const profile = await Profile.findOneAndUpdate({ userId: req.auth!.userId }, { $set: input, $setOnInsert: { userId: req.auth!.userId } }, { upsert: true, new: true, runValidators: true }); return res.json({ profile }); }
