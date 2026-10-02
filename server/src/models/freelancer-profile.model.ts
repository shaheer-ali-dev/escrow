import mongoose, { Schema } from "mongoose";

export interface FreelancerProfileDoc {
  walletAddress: string;
  name: string;
  bio?: string;
  skills: string[];
  hourlyRate?: number;
  totalEarned: number;
  completedMilestones: number;
  averageRating: number;
  profileImage?: string;
  portfolio?: string[];
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

const freelancerProfileSchema = new Schema<FreelancerProfileDoc>(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    bio: String,
    skills: { type: [String], default: [] },
    hourlyRate: Number,
    totalEarned: { type: Number, default: 0 },
    completedMilestones: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    profileImage: String,
    portfolio: { type: [String], default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  { timestamps: true }
);

freelancerProfileSchema.index({ skills: 1, status: 1 });
freelancerProfileSchema.index({ averageRating: -1, status: 1 });

export const FreelancerProfile = mongoose.model<FreelancerProfileDoc>(
  "FreelancerProfile",
  freelancerProfileSchema
);