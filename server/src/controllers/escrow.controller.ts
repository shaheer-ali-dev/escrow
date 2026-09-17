import type { Request, Response } from "express";
import { listEscrowsForUser, getEscrowWithMilestones } from "../services/escrow.service.js";

export async function listEscrows(req: Request, res: Response) {
  const data = await listEscrowsForUser(req.auth!.userId);
  return res.json({ escrows: data });
}

export async function getSingleEscrow(req: Request, res: Response) {
  const data = await getEscrowWithMilestones(req.params.address);
  if (!data) {
    return res.status(404).json({ error: "Escrow not found" });
  }
  return res.json(data);
}
