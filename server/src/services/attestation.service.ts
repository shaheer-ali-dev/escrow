import crypto from "crypto";
import { Attestation } from "../models/attestation.model.js";
import { env } from "../config/env.js";

export async function createAttestation(
  milestoneId: string,
  escrowAddress: string,
  evaluationId: string,
  policyDecision: "auto_release" | "manual_review" | "hold",
  payload: Record<string, any>
) {
  const attestationPayload = {
    milestoneId,
    escrowAddress,
    evaluationId,
    policyDecision,
    payload,
    createdAt: new Date().toISOString(),
  };

  const signature = crypto
    .createHmac("sha256", env.JWT_SECRET)
    .update(JSON.stringify(attestationPayload))
    .digest("hex");

  return Attestation.create({
    milestoneId,
    escrowAddress,
    evaluationId,
    policyDecision,
    attestationPayload,
    signature,
    verificationKey: "hmac-sha256",
    status: "pending",
  });
}

export async function signAttestation(
  attestationId: string,
  signature: string,
  verificationKey: string
) {
  return Attestation.findByIdAndUpdate(
    attestationId,
    {
      signature,
      verificationKey,
      status: "signed",
    },
    { new: true }
  );
}

export async function verifyAttestation(attestationId: string) {
  return Attestation.findByIdAndUpdate(
    attestationId,
    { status: "verified" },
    { new: true }
  );
}

export async function getAttestation(attestationId: string) {
  return Attestation.findById(attestationId).lean();
}

export async function getPolicyDecision(
  confidenceScore: number,
  deterministic: boolean
): Promise<"auto_release" | "manual_review" | "hold"> {
  if (deterministic && confidenceScore >= 95) {
    return "auto_release";
  }
  if (confidenceScore >= 80) {
    return "manual_review";
  }
  return "hold";
}
