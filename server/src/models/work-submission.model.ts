import mongoose, { Schema } from "mongoose";

export interface WorkSubmissionDoc {
  escrowAddress: string;
  milestoneIndex: number;
  freelancer: string;
  submissionUri: string;
  description: string;
  evidenceHashes: string[];
  status: "pending" | "submitted" | "evaluated" | "rejected";
  aiEvaluationScore?: number;
  aiEvaluationResult?: string;
  submittedAt: Date;
  evaluatedAt?: Date;
}

const workSubmissionSchema = new Schema<WorkSubmissionDoc>(
  {
    escrowAddress: { type: String, required: true, index: true },
    milestoneIndex: { type: Number, required: true },
    freelancer: { type: String, required: true, index: true },
    submissionUri: { type: String, required: true },
    description: { type: String, required: true },
    evidenceHashes: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "submitted", "evaluated", "rejected"],
      default: "pending",
      index: true,
    },
    aiEvaluationScore: Number,
    aiEvaluationResult: String,
    submittedAt: { type: Date, default: new Date() },
    evaluatedAt: Date,
  },
  { timestamps: true }
);

export const WorkSubmission = mongoose.model<WorkSubmissionDoc>(
  "WorkSubmission",
  workSubmissionSchema
);