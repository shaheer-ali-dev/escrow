import mongoose, { Schema } from "mongoose";

export interface ReputationSummaryDoc {
  walletAddress: string;
  completedContracts: number;
  cancelledContracts: number;
  activeContracts: number;
  earnedLamports: string;
  contractVolumeLamports: string;
  completionRate: number;
  repeatClients: number;
  uniqueClients: number;
  milestoneReleases: number;
  averageContractLamports: string;
  evidenceSignatures: string[];
  calculatedAt: Date;
}

const schema = new Schema<ReputationSummaryDoc>({
  walletAddress: { type: String, unique: true, required: true, index: true },
  completedContracts: { type: Number, default: 0 },
  cancelledContracts: { type: Number, default: 0 },
  activeContracts: { type: Number, default: 0 },
  earnedLamports: { type: String, default: "0" },
  contractVolumeLamports: { type: String, default: "0" },
  completionRate: { type: Number, default: 0 },
  repeatClients: { type: Number, default: 0 },
  uniqueClients: { type: Number, default: 0 },
  milestoneReleases: { type: Number, default: 0 },
  averageContractLamports: { type: String, default: "0" },
  evidenceSignatures: { type: [String], default: [] },
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const ReputationSummary = mongoose.model<ReputationSummaryDoc>("ReputationSummary", schema);
