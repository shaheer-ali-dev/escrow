import mongoose, { Schema } from "mongoose";

export interface AttestationDoc {
  milestoneId: string;
  escrowAddress: string;
  evaluationId: string;
  policyDecision: "auto_release" | "manual_review" | "hold";
  attestationPayload: Record<string, any>;
  signature?: string;
  verificationKey?: string;
  status: "pending" | "signed" | "verified";
  createdAt?: Date;
  updatedAt?: Date;
}

const attestationSchema = new Schema<AttestationDoc>(
  {
    milestoneId: { type: String, required: true, index: true },
    escrowAddress: { type: String, required: true, index: true },
    evaluationId: { type: String, required: true },
    policyDecision: {
      type: String,
      enum: ["auto_release", "manual_review", "hold"],
      default: "manual_review",
    },
    attestationPayload: { type: Schema.Types.Mixed, required: true },
    signature: String,
    verificationKey: String,
    status: {
      type: String,
      enum: ["pending", "signed", "verified"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export const Attestation = mongoose.model<AttestationDoc>(
  "Attestation",
  attestationSchema
);