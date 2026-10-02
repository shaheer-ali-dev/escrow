import crypto from "crypto";
import { Evidence } from "../models/evidence.model.js";

function stableHash(input: Record<string, any>) {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export async function submitEvidence(
  milestoneId: string,
  escrowAddress: string,
  submittedBy: string,
  evidenceUri: string,
  metadata: Record<string, any>
) {
  const normalizedMetadata = metadata ?? {};
  const evidenceHash = stableHash({
    milestoneId,
    escrowAddress,
    evidenceUri,
    metadata: normalizedMetadata,
    submittedBy,
  });

  return Evidence.create({
    milestoneId,
    escrowAddress,
    submittedBy,
    evidenceUri,
    evidenceHash,
    metadata: normalizedMetadata,
    status: "pending",
  });
}

export async function getEvidence(milestoneId: string) {
  return Evidence.find({ milestoneId }).sort({ createdAt: -1 }).lean();
}

export async function getEvidenceById(evidenceId: string) {
  return Evidence.findById(evidenceId).lean();
}

export async function verifyEvidence(evidenceId: string) {
  return Evidence.findByIdAndUpdate(
    evidenceId,
    { status: "verified", verifiedAt: new Date() },
    { new: true }
  );
}

export async function rejectEvidence(evidenceId: string, reason?: string) {
  return Evidence.findByIdAndUpdate(
    evidenceId,
    {
      status: "rejected",
      metadata: {
        ...(reason ? { rejectionReason: reason } : {}),
      },
      verifiedAt: null,
    },
    { new: true }
  );
}
