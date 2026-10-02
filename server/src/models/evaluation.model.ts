import mongoose, { Schema } from "mongoose";

export interface EvaluationDoc {
  milestoneId: string;
  escrowAddress: string;
  evidenceId: string;
  evaluationType: "ai" | "manual";
  confidenceScore: number;
  deterministic: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    details: string;
  }>;
  result: "pass" | "fail" | "needs_review";
  reasoning: string;
  evaluatedBy?: string;
  evaluatedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const evaluationSchema = new Schema<EvaluationDoc>(
  {
    milestoneId: { type: String, required: true, index: true },
    escrowAddress: { type: String, required: true, index: true },
    evidenceId: { type: String, required: true },
    evaluationType: {
      type: String,
      enum: ["ai", "manual"],
      default: "ai",
    },
    confidenceScore: { type: Number, min: 0, max: 100, required: true },
    deterministic: { type: Boolean, default: false },
    checks: [
      {
        name: String,
        passed: Boolean,
        details: String,
      },
    ],
    result: {
      type: String,
      enum: ["pass", "fail", "needs_review"],
      default: "needs_review",
      index: true,
    },
    reasoning: String,
    evaluatedBy: String,
    evaluatedAt: { type: Date, default: new Date() },
  },
  { timestamps: true }
);

export const Evaluation = mongoose.model<EvaluationDoc>(
  "Evaluation",
  evaluationSchema
);