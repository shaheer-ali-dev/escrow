import type { Request, Response } from "express";
import { PublicKey } from "@solana/web3.js";
import { Profile } from "../models/profile.model.js";
import { ReputationSummary } from "../models/reputation-summary.model.js";
import { WalletActivity } from "../models/wallet-activity.model.js";
import { WalletAnalytics } from "../models/wallet-analytics.model.js";
import { ChainEvent } from "../models/chain-event.model.js";
import { rebuildReputation } from "../services/reputation-aggregation.service.js";
import { scanWalletActivity } from "../services/wallet-activity.service.js";

export async function getWalletProfile(req: Request, res: Response) {
  const wallet = new PublicKey(req.params.address).toBase58();
  const profile = await Profile.findOne({ walletAddress: wallet }).lean();
  const reputation = await ReputationSummary.findOne({ walletAddress: wallet }).lean();
  const activity = await WalletActivity.findOne({ walletAddress: wallet }).lean();
  const analytics = await WalletAnalytics.findOne({ walletAddress: wallet }).lean();
  return res.json({ wallet, ownershipVerified: Boolean(profile?.walletVerifiedAt), professionalHistory: reputation, walletActivity: activity, trading: { realizedPnlLamports: null, unrealizedPnlLamports: null, tradingVolumeLamports: null, profitableTradesPercent: null, coveragePercent: 0, status: "insufficient_supported_data", excluded: ["unsupported DEXs", "historical prices", "self-transfers", "LP, staking, lending, bridges"] }, risk: { level: analytics?.riskSignals?.length ? "moderate" : "unknown", score: null, signals: analytics?.riskSignals ?? [], methodology: "Evidence-based signals only; no safe/scammer classification." }, reliability: { score: reputation ? Math.min(1000, reputation.completedContracts * 20 + reputation.milestoneReleases * 5) : null, label: reputation ? "evidence_based" : "insufficient_evidence", explanation: "Score is derived only from indexed BlockSub events and reported wallet evidence." } });
}

export async function scanWalletProfile(req: Request, res: Response) { const address = new PublicKey(req.params.address).toBase58(); const scan = await scanWalletActivity(address); const reputation = await rebuildReputation(address); return res.json({ wallet: address, scan, professionalHistory: reputation }); }
export async function getEvidence(req: Request, res: Response) { const wallet = new PublicKey(req.params.address).toBase58(); return res.json({ events: await ChainEvent.find({ walletAddresses: wallet }).sort({ createdAt: -1 }).limit(100).lean() }); }
