import type { Request, Response } from "express";
import { getProfileService, updateProfileService } from "../services/profile.service.js";

export async function getProfile(req: Request, res: Response) {
  const profile = await getProfileService(req.auth!.userId);
  return res.json({ profile });
}

export async function updateProfile(req: Request, res: Response) {
  const profile = await updateProfileService(req.auth!.userId, req.body);
  return res.json({ profile });
}
