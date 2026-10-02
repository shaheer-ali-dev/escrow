import mongoose, { Schema } from "mongoose";

export interface DisputeDoc {
  milestoneId: string;
  escrowAddress: string;
  initiatedBy: string;
  reason: string;
  status: "open" | "under_review" | "resolved" | "closed";
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const disputeSchema = new Schema<DisputeDoc>(
  {
    milestoneId: { type: String, required: true, index: true },
    escrowAddress: { type: String, required: true, index: true },
    initiatedBy: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "closed"],
      default: "open",
      index: true,
    },
    resolution: String,
    resolvedBy: String,
    resolvedAt: Date,
  },
  { timestamps: true }
);

export const Dispute = mongoose.model<DisputeDoc>(
  "Dispute",
  disputeSchema
);