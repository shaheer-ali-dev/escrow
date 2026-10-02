import { Dispute } from "../models/dispute.model.js";
import { DisputeResolution } from "../models/dispute-resolution.model.js";

export async function createDispute(
  milestoneId: string,
  escrowAddress: string,
  initiatedBy: string,
  reason: string
) {
  return Dispute.create({
    milestoneId,
    escrowAddress,
    initiatedBy,
    reason,
    status: "open",
  });
}

export async function getDispute(disputeId: string) {
  return Dispute.findById(disputeId).lean();
}

export async function getDisputesByMilestone(milestoneId: string) {
  return Dispute.find({ milestoneId }).lean();
}

export async function resolveDispute(
  disputeId: string,
  decision: "approve_freelancer" | "refund_client" | "partial_release",
  reasoning: string,
  resolvedBy: string,
  paymentAdjustment?: number
) {
  await Dispute.findByIdAndUpdate(
    disputeId,
    {
      status: "resolved",
      resolvedBy,
      resolvedAt: new Date(),
      resolution: decision,
    },
    { new: true }
  );

  return DisputeResolution.create({
    disputeId,
    escrowAddress: (await Dispute.findById(disputeId))?.escrowAddress,
    decision,
    reasoning,
    resolvedBy,
    paymentAdjustment,
  });
}