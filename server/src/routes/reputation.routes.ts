import { Router } from "express";
import { WalletAnalytics } from "../models/wallet-analytics.model.js";
import { ChainEvent } from "../models/chain-event.model.js";
const router = Router();
router.get("/wallet/:address", async (req, res) => { const analytics = await WalletAnalytics.findOne({ walletAddress: req.params.address }); return res.json({ analytics }); });
router.get("/wallet/:address/events", async (req, res) => { const events = await ChainEvent.find({ walletAddresses: req.params.address }).sort({ createdAt: -1 }).limit(100); return res.json({ events }); });
export default router;
