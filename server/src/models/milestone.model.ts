import mongoose, { Schema } from "mongoose";

export type MilestoneStatus = "pending" | "released" | "cancelled";

export interface MilestoneDoc {
  escrowAddress: string;
  index: number;
  amountLamports: string;
  dueAt: Date;
  status: MilestoneStatus;
  transactionSignature?: string;
}

const milestoneSchema = new Schema<MilestoneDoc>(
  {
    escrowAddress: { type: String, required: true, index: true },
    index: { type: Number, required: true },
    amountLamports: { type: String, required: true },
    dueAt: { type: Date, required: true },
    status: { type: String, enum: ["pending", "released", "cancelled"], default: "pending" },
    transactionSignature: String,
  },
  { timestamps: true }
);

milestoneSchema.index({ escrowAddress: 1, index: 1 }, { unique: true });

export const Milestone = mongoose.model<MilestoneDoc>("Milestone", milestoneSchema);
