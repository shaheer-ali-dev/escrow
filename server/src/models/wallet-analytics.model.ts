import mongoose, { Schema } from "mongoose";

export interface WalletAnalyticsDoc {
  walletAddress: string;
  riskScore?: number;
  riskLevel?: "low" | "medium" | "high";
  riskSignals?: any[];
  estimatedBalance?: string;
  transactionPattern?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const walletAnalyticsSchema = new Schema<WalletAnalyticsDoc>(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    riskScore: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
    riskSignals: { type: [Schema.Types.Mixed], default: [] },
    estimatedBalance: String,
    transactionPattern: String,
  },
  { timestamps: true }
);

export const WalletAnalytics = mongoose.model<WalletAnalyticsDoc>("WalletAnalytics", walletAnalyticsSchema);