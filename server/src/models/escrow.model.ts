import mongoose, { Schema } from "mongoose";

export type EscrowStatus = "active" | "completed" | "cancelled";

export interface EscrowDoc {
  address: string;
  vaultAddress: string;
  client: string;
  freelancer: string;
  totalLamports: string;
  allocatedLamports: string;
  releasedLamports: string;
  milestoneCount: number;
  completedMilestones: number;
  deadline: Date;
  status: EscrowStatus;
  createdSignature?: string;
}

const escrowSchema = new Schema<EscrowDoc>(
  {
    address: { type: String, unique: true, index: true, required: true },
    vaultAddress: { type: String, required: true },
    client: { type: String, required: true, index: true },
    freelancer: { type: String, required: true, index: true },
    totalLamports: { type: String, required: true },
    allocatedLamports: { type: String, required: true, default: "0" },
    releasedLamports: { type: String, required: true, default: "0" },
    milestoneCount: { type: Number, required: true },
    completedMilestones: { type: Number, default: 0 },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active", index: true },
    createdSignature: String,
  },
  { timestamps: true }
);

escrowSchema.index({ client: 1, createdAt: -1 });
escrowSchema.index({ freelancer: 1, createdAt: -1 });

export const Escrow = mongoose.model<EscrowDoc>("Escrow", escrowSchema);
