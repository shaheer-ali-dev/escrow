import { z } from "zod";
import { Escrow } from "../models/escrow.model.js";
import { Milestone } from "../models/milestone.model.js";
import { Profile } from "../models/profile.model.js";
export async function listEscrowsForUser(userId: string) { const profile = await Profile.findOne({ userId }).lean(); if (!profile?.walletAddress) return []; return Escrow.find({ $or: [{ client: profile.walletAddress }, { freelancer: profile.walletAddress }] }).sort({ createdAt: -1 }).limit(100).lean(); }
export async function getEscrowWithMilestones(address: string) { const escrow = await Escrow.findOne({ address }).lean(); if (!escrow) return null; return { escrow, milestones: await Milestone.find({ escrowAddress: address }).sort({ index: 1 }).lean() }; }
