import type { Request, Response } from "express";
import { z } from "zod";
import { scanWallet, getWalletAnalytics, getWalletEvents } from "../services/wallet-intelligence.service.js";

const addressSchema = z.string().min(32).max(44);

export async function scanWalletController(req: Request, res: Response) {
  const address = addressSchema.parse(req.params.address);
  const result = await scanWallet(address);
  return res.json({ wallet: result });
}

export async function getWalletAnalyticsController(req: Request, res: Response) {
  const address = addressSchema.parse(req.params.address);
  return res.json({ analytics: await getWalletAnalytics(address) });
}

export async function getWalletEventsController(req: Request, res: Response) {
  const address = addressSchema.parse(req.params.address);
  return res.json({ events: await getWalletEvents(address) });
}
