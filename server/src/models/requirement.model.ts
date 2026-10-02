import mongoose, { Schema } from "mongoose";

export interface RequirementDoc {
  milestoneId: string;
  escrowAddress: string;
  title: string;
  description: string;
  requirementHash: string;
  status: "pending" | "fulfilled" | "disputed";
  createdAt?: Date;
  updatedAt?: Date;
}

const requirementSchema = new Schema<RequirementDoc>(
  {
    milestoneId: { type: String, required: true, index: true },
    escrowAddress: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirementHash: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "fulfilled", "disputed"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export const Requirement = mongoose.model<RequirementDoc>(
  "Requirement",
  requirementSchema
);