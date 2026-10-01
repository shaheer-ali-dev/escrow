import type { Request, Response } from "express";
import { z } from "zod";
import {
  submitWork,
  getWorkSubmission,
  evaluateWork,
  rejectWork,
} from "../services/work-submission.service.js";

const submitWorkSchema = z.object({
  escrowAddress: z.string().min(32),
  milestoneIndex: z.number().int().min(0).max(255),
  submissionUri: z.string().url(),
  description: z.string().min(10),
  evidenceHashes: z.array(z.string()).default([]),
});

const evaluateWorkSchema = z.object({
  score: z.number().min(0).max(100),
  result: z.string().min(10),
});

const rejectWorkSchema = z.object({
  reason: z.string().min(10),
});

export async function submitWorkEndpoint(req: Request, res: Response) {
  try {
    const data = submitWorkSchema.parse(req.body);
    const submission = await submitWork(
      data.escrowAddress,
      data.milestoneIndex,
      req.auth!.userId,
      data.submissionUri,
      data.description,
      data.evidenceHashes
    );
    return res.status(201).json(submission);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getWorkSubmissionEndpoint(req: Request, res: Response) {
  try {
    const { escrowAddress, milestoneIndex } = req.params;
    const submission = await getWorkSubmission(
      escrowAddress,
      parseInt(milestoneIndex)
    );
    if (!submission) {
      return res.status(404).json({ error: "Work submission not found" });
    }
    return res.json(submission);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function evaluateWorkEndpoint(req: Request, res: Response) {
  try {
    const data = evaluateWorkSchema.parse(req.body);
    const { escrowAddress, milestoneIndex } = req.params;
    const result = await evaluateWork(
      escrowAddress,
      parseInt(milestoneIndex),
      data.score,
      data.result
    );
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function rejectWorkEndpoint(req: Request, res: Response) {
  try {
    const data = rejectWorkSchema.parse(req.body);
    const { escrowAddress, milestoneIndex } = req.params;
    const result = await rejectWork(
      escrowAddress,
      parseInt(milestoneIndex),
      data.reason
    );
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}