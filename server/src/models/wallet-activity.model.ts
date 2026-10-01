import mongoose, { Schema } from "mongoose";

export interface WalletActivityDoc {
  walletAddress: string;
  transactionCount: number;
  lastActivity: Date;
  tokenBalances?: any[];
  counterparties?: any[];
  failedTransactionCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const walletActivitySchema = new Schema<WalletActivityDoc>(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    transactionCount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: new Date() },
    tokenBalances: { type: [Schema.Types.Mixed], default: [] },
    counterparties: { type: [Schema.Types.Mixed], default: [] },
    failedTransactionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const WalletActivity = mongoose.model<WalletActivityDoc>("WalletActivity", walletActivitySchema);