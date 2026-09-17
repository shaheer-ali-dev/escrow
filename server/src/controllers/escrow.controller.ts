import type { Request, Response } from "express";
import { Escrow } from "../models/escrow.model.js";
import { Milestone } from "../models/milestone.model.js";
export async function listMyEscrows(req: Request, res: Response) { const profile = req.auth!.userId; const rows = await Escrow.find({ $or: [{ client: profile }, { freelancer: profile }] }).sort({ createdAt: -1 }).limit(100); return res.json({ escrows: rows }); }
export async function getEscrow(req: Request, res: Response) { const escrow = await Escrow.findOne({ address: req.params.address }); if (!escrow) return res.status(404).json({ error: "Escrow not found" }); const milestones = await Milestone.find({ escrowAddress: escrow.address }).sort({ index: 1 }); return res.json({ escrow, milestones }); }
