import mongoose, { Schema } from "mongoose";

export interface DisputeResolutionDoc {
  disputeId: string;
  escrowAddress: string;
  decision: "approve_freelancer" | "refund_client" | "partial_release";
  reasoning: string;
  resolvedBy: string;
  paymentAdjustment?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const disputeResolutionSchema = new Schema<DisputeResolutionDoc>(
  {
    disputeId: { type: String, required: true, unique: true, index: true },
    escrowAddress: { type: String, required: true, index: true },
    decision: {
      type: String,
      enum: ["approve_freelancer", "refund_client", "partial_release"],
      required: true,
    },
    reasoning: { type: String, required: true },
    resolvedBy: { type: String, required: true },
    paymentAdjustment: Number,
  },
  { timestamps: true }
);

export const DisputeResolution = mongoose.model<DisputeResolutionDoc>(
  "DisputeResolution",
  disputeResolutionSchema
);