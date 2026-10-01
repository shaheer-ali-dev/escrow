import type { Request, Response } from "express";
import { Escrow } from "../models/escrow.model.js";
import {
  cancelEscrowTransaction,
  createEscrowTransaction,
  createMilestoneTransaction,
  releaseMilestoneTransaction,
  syncEscrow,
} from "../services/escrow.service.js";

export async function listEscrows(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const escrows = await Escrow.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return res.json({ escrows });
}

export async function getSingleEscrow(req: Request, res: Response) {
  const { address } = req.params;
  const escrow = await Escrow.findOne({ address }).lean();
  if (!escrow) {
    return res.status(404).json({ error: "Escrow not found" });
  }
  return res.json({ escrow });
}

export async function buildCreateEscrow(req: Request, res: Response) {
  const result = await createEscrowTransaction(req.auth!.userId, req.body);
  return res.status(200).json(result);
}

export async function buildCreateMilestone(req: Request, res: Response) {
  const result = await createMilestoneTransaction(req.auth!.userId, req.params.address, req.body);
  return res.json(result);
}

export async function buildReleaseMilestone(req: Request, res: Response) {
  const result = await releaseMilestoneTransaction(req.auth!.userId, req.params.address, req.body);
  return res.json(result);
}

export async function buildCancelEscrow(req: Request, res: Response) {
  const result = await cancelEscrowTransaction(req.auth!.userId, req.params.address);
  return res.json(result);
}

export async function syncOnChainEscrow(req: Request, res: Response) {
  const result = await syncEscrow(req.auth!.userId, req.params.address, (req.body as { signature: string }).signature);
  return res.json(result);
}