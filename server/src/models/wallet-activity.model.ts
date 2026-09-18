import mongoose, { Schema } from "mongoose";

export interface WalletActivityDoc {
  walletAddress: string;
  transactionCount: number;
  successfulTransactionCount: number;
  failedTransactionCount: number;
  firstObservedAt?: Date;
  lastObservedAt?: Date;
  solBalanceLamports: string;
  incomingLamports: string;
  outgoingLamports: string;
  protocolCount: number;
  splTokenCount: number;
  tokenBalances: Array<{ mint: string; amount: string; decimals: number }>;
  counterparties: Array<{ address: string; transactionCount: number }>;
  coveragePercent: number;
  calculatedAt: Date;
}

const schema = new Schema<WalletActivityDoc>({
  walletAddress: { type: String, unique: true, required: true, index: true },
  transactionCount: { type: Number, default: 0 },
  successfulTransactionCount: { type: Number, default: 0 },
  failedTransactionCount: { type: Number, default: 0 },
  firstObservedAt: Date,
  lastObservedAt: Date,
  solBalanceLamports: { type: String, default: "0" },
  incomingLamports: { type: String, default: "0" },
  outgoingLamports: { type: String, default: "0" },
  protocolCount: { type: Number, default: 0 },
  splTokenCount: { type: Number, default: 0 },
  tokenBalances: { type: [Schema.Types.Mixed], default: [] },
  counterparties: { type: [Schema.Types.Mixed], default: [] },
  coveragePercent: { type: Number, default: 0 },
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const WalletActivity = mongoose.model<WalletActivityDoc>("WalletActivity", schema);
