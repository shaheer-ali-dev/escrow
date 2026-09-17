import type { Request, Response } from "express";
import { cancelEscrowTransaction, createEscrowTransaction, createMilestoneTransaction, releaseMilestoneTransaction, syncEscrow } from "../services/escrow.service.js";

export async function buildCreateEscrow(req: Request, res: Response) { const result = await createEscrowTransaction(req.auth!.userId, req.body); return res.status(200).json(result); }
export async function buildCreateMilestone(req: Request, res: Response) { const result = await createMilestoneTransaction(req.auth!.userId, req.params.address, req.body); return res.json(result); }
export async function buildReleaseMilestone(req: Request, res: Response) { const result = await releaseMilestoneTransaction(req.auth!.userId, req.params.address, req.body); return res.json(result); }
export async function buildCancelEscrow(req: Request, res: Response) { const result = await cancelEscrowTransaction(req.auth!.userId, req.params.address); return res.json(result); }
export async function syncOnChainEscrow(req: Request, res: Response) { const result = await syncEscrow(req.auth!.userId, req.params.address, (req.body as { signature: string }).signature); return res.json({ escrow: result }); }
