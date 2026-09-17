import { z } from "zod";
import { Escrow } from "../models/escrow.model.js";
import { Milestone } from "../models/milestone.model.js";

export async function listEscrowsForUser(userId: string) {
  return Escrow.find({
    $or: [{ client: userId }, { freelancer: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
}

export async function getEscrowWithMilestones(address: string) {
  const escrow = await Escrow.findOne({ address }).lean();
  if (!escrow) {
    return null;
  }

  const milestones = await Milestone.find({ escrowAddress: address }).sort({ index: 1 }).lean();
  return { escrow, milestones };
}
