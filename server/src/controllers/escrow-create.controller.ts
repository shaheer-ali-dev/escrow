import type { Request, Response } from "express";
import { Escrow } from "../models/escrow.model.js";
import { Milestone } from "../models/milestone.model.js";
import {
  createEscrowTransaction,
  createMilestoneTransaction,
  releaseMilestoneTransaction,
  cancelEscrowTransaction,
} from "../services/escrow.service.js";

export async function createEscrowEndpoint(req: Request, res: Response) {
  try {
    const result = await createEscrowTransaction(req.auth!.userId, req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function createMilestoneEndpoint(req: Request, res: Response) {
  try {
    const result = await createMilestoneTransaction(
      req.auth!.userId,
      req.params.address,
      req.body
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function releaseMilestoneEndpoint(req: Request, res: Response) {
  try {
    const result = await releaseMilestoneTransaction(
      req.auth!.userId,
      req.params.address,
      req.body
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function cancelEscrowEndpoint(req: Request, res: Response) {
  try {
    const result = await cancelEscrowTransaction(
      req.auth!.userId,
      req.params.address
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function syncEscrowEndpoint(req: Request, res: Response) {
  try {
    const { syncEscrow } = await import("../services/escrow.service.js");
    const result = await syncEscrow(
      req.auth!.userId,
      req.params.address,
      (req.body as { signature: string }).signature
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}