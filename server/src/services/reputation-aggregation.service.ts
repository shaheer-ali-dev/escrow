import { Escrow } from "../models/escrow.model.js";
import { ChainEvent } from "../models/chain-event.model.js";
import { ReputationSummary } from "../models/reputation-summary.model.js";

export async function rebuildReputation(walletAddress: string) {
  const escrows = await Escrow.find({ $or: [{ client: walletAddress }, { freelancer: walletAddress }] }).lean();
  const asFreelancer = escrows.filter((e) => e.freelancer === walletAddress);
  const completed = asFreelancer.filter((e) => e.status === "completed");
  const cancelled = asFreelancer.filter((e) => e.status === "cancelled");
  const active = asFreelancer.filter((e) => e.status === "active");
  const clients = new Set(asFreelancer.map((e) => e.client));
  const clientCounts = new Map<string, number>();
  for (const escrow of asFreelancer) clientCounts.set(escrow.client, (clientCounts.get(escrow.client) ?? 0) + 1);
  const repeatClients = [...clientCounts.values()].filter((count) => count > 1).length;
  const earned = completed.reduce((sum, e) => sum + BigInt(e.releasedLamports || "0"), 0n);
  const volume = asFreelancer.reduce((sum, e) => sum + BigInt(e.totalLamports || "0"), 0n);
  const releases = await ChainEvent.countDocuments({ walletAddresses: walletAddress, type: "milestone_released" });
  const evidence = await ChainEvent.find({ walletAddresses: walletAddress }).sort({ createdAt: -1 }).limit(100).select("signature -_id").lean();
  const totalClosed = completed.length + cancelled.length;
  const summary = { walletAddress, completedContracts: completed.length, cancelledContracts: cancelled.length, activeContracts: active.length, earnedLamports: earned.toString(), contractVolumeLamports: volume.toString(), completionRate: totalClosed ? Math.round((completed.length / totalClosed) * 100) : 0, repeatClients, uniqueClients: clients.size, milestoneReleases: releases, averageContractLamports: asFreelancer.length ? (volume / BigInt(asFreelancer.length)).toString() : "0", evidenceSignatures: evidence.map((e) => e.signature), calculatedAt: new Date() };
  return ReputationSummary.findOneAndUpdate({ walletAddress }, summary, { upsert: true, new: true });
}
