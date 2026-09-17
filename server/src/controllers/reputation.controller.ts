import type { Request, Response } from "express";
import { getWalletAnalytics, getWalletEvents } from "../services/reputation.service.js";

export async function getWalletAnalyticsController(req: Request, res: Response) {
  const data = await getWalletAnalytics(req.params.address);
  return res.json({ analytics: data });
}

export async function getWalletEventsController(req: Request, res: Response) {
  const data = await getWalletEvents(req.params.address);
  return res.json({ events: data });
}
