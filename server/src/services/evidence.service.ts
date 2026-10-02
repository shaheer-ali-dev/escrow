import { Evidence } from "../models/evidence.model.js";
import crypto from "crypto";

export async function submitEvidence(
  milestoneId: string,
  escrowAddress: string,
  submittedBy: string,
  evidenceUri: string,
  metadata: Record<string, any>
) {
  const evidenceHash = crypto
    .createHash("sha256")
    .update(`${milestoneId}${evidenceUri}${Date.now()}`)
    .digest("hex");

  return Evidence.create({
    milestoneId,
    escrowAddress,
    submittedBy,
    evidenceUri,
    evidenceHash,
    metadata,
    status: "pending",
  });
}

export async function getEvidence(milestoneId: string) {
  return Evidence.find({ milestoneId }).lean();
}

export async function verifyEvidence(evidenceId: string) {
  return Evidence.findByIdAndUpdate(
    evidenceId,
    { status: "verified", verifiedAt: new Date() },
    { new: true }
  );
}

export async function rejectEvidence(evidenceId: string) {
  return Evidence.findByIdAndUpdate(
    evidenceId,
    { status: "rejected" },
    { new: true }
  );
}