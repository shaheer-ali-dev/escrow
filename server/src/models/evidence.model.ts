import mongoose, { Schema } from "mongoose";

export interface EvidenceDoc {
  milestoneId: string;
  escrowAddress: string;
  submittedBy: string;
  evidenceUri: string;
  evidenceHash: string;
  metadata: Record<string, any>;
  status: "pending" | "verified" | "rejected";
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const evidenceSchema = new Schema<EvidenceDoc>(
  {
    milestoneId: { type: String, required: true, index: true },
    escrowAddress: { type: String, required: true, index: true },
    submittedBy: { type: String, required: true },
    evidenceUri: { type: String, required: true },
    evidenceHash: { type: String, required: true, unique: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    verifiedAt: Date,
  },
  { timestamps: true }
);

export const Evidence = mongoose.model<EvidenceDoc>(
  "Evidence",
  evidenceSchema
);