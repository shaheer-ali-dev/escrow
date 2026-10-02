import { Requirement } from "../models/requirement.model.js";
import crypto from "crypto";

export async function createRequirement(
  milestoneId: string,
  escrowAddress: string,
  title: string,
  description: string
) {
  const requirementHash = crypto
    .createHash("sha256")
    .update(`${milestoneId}${title}${description}`)
    .digest("hex");

  return Requirement.create({
    milestoneId,
    escrowAddress,
    title,
    description,
    requirementHash,
  });
}

export async function getRequirements(milestoneId: string) {
  return Requirement.find({ milestoneId }).lean();
}

export async function updateRequirementStatus(
  milestoneId: string,
  status: "pending" | "fulfilled" | "disputed"
) {
  return Requirement.updateMany({ milestoneId }, { status });
}