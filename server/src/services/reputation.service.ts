import { ChainEvent } from "../models/chain-event.model.js";
import { WalletAnalytics } from "../models/wallet-analytics.model.js";

export async function getWalletAnalytics(address: string) {
  return WalletAnalytics.findOne({ walletAddress: address }).lean();
}

export async function getWalletEvents(address: string) {
  return ChainEvent.find({ walletAddresses: address }).sort({ createdAt: -1 }).limit(100).lean();
}
