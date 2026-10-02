import type { Request, Response } from "express";
import { z } from "zod";
import {
  createEvaluation,
  getEvaluation,
  getEvaluationsByMilestone,
  updateEvaluationResult,
} from "../services/evaluation.service.js";
import { evaluateWithAI } from "../services/ai-evaluation.service.js";
import {
  submitEvidence,
  getEvidence,
  verifyEvidence,
  rejectEvidence,
} from "../services/evidence.service.js";
import {
  createDispute,
  getDispute,
  getDisputesByMilestone,
  resolveDispute,
} from "../services/dispute.service.js";
import {
  getNotifications,
  markAsRead,
  getUnreadCount,
  deleteNotification,
  createNotification,
} from "../services/notification.service.js";

// Schemas
const submitEvidenceSchema = z.object({
  milestoneId: z.string(),
  escrowAddress: z.string(),
  evidenceUri: z.string().url(),
  metadata: z.record(z.any()).optional(),
});

const evaluateWithAISchema = z.object({
  milestoneId: z.string(),
  escrowAddress: z.string(),
  evidenceId: z.string(),
  requirementDescription: z.string(),
  submissionContent: z.string(),
  type: z.enum(["work", "code", "documentation"]).default("work"),
  language: z.string().optional(),
  testResults: z.string().optional(),
});

const updateEvaluationSchema = z.object({
  result: z.enum(["pass", "fail", "needs_review"]),
});

const createDisputeSchema = z.object({
  milestoneId: z.string(),
  escrowAddress: z.string(),
  reason: z.string().min(10),
});

const resolveDisputeSchema = z.object({
  decision: z.enum(["approve_freelancer", "refund_client", "partial_release"]),
  reasoning: z.string(),
  paymentAdjustment: z.number().optional(),
});

// EVIDENCE ENDPOINTS
export async function submitEvidenceEndpoint(req: Request, res: Response) {
  try {
    const data = submitEvidenceSchema.parse(req.body);
    const evidence = await submitEvidence(
      data.milestoneId,
      data.escrowAddress,
      req.auth!.userId,
      data.evidenceUri,
      data.metadata || {}
    );
    await createNotification(
      req.auth!.userId,
      "milestone_completed",
      "Evidence Submitted",
      `Evidence for milestone ${data.milestoneId} has been submitted`,
      `/evaluations`
    );
    return res.status(201).json(evidence);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getEvidenceEndpoint(req: Request, res: Response) {
  try {
    const { milestoneId } = req.params;
    const evidence = await getEvidence(milestoneId);
    return res.json(evidence);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function verifyEvidenceEndpoint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const evidence = await verifyEvidence(id);
    return res.json(evidence);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function rejectEvidenceEndpoint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const evidence = await rejectEvidence(id);
    return res.json(evidence);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

// AI EVALUATION ENDPOINTS
export async function evaluateWithAIEndpoint(req: Request, res: Response) {
  try {
    const data = evaluateWithAISchema.parse(req.body);

    const aiResult = await evaluateWithAI(
      data.requirementDescription,
      data.submissionContent,
      data.type,
      data.language,
      data.testResults
    );

    const evaluation = await createEvaluation(
      data.milestoneId,
      data.escrowAddress,
      data.evidenceId,
      aiResult.checks,
      aiResult.confidenceScore,
      aiResult.reasoning
    );

    const notificationType =
      aiResult.passed || aiResult.confidenceScore >= 80
        ? "evaluation_ready"
        : "admin_alert";

    await createNotification(
      req.auth!.userId,
      notificationType,
      `AI Evaluation Complete (${aiResult.confidenceScore}% confidence)`,
      aiResult.reasoning,
      `/evaluations/${evaluation._id}`
    );

    return res.status(201).json({
      evaluation,
      aiAnalysis: {
        passed: aiResult.passed,
        confidenceScore: aiResult.confidenceScore,
        deterministic: aiResult.deterministic,
        reasoning: aiResult.reasoning,
        checks: aiResult.checks,
      },
    });
  } catch (error: any) {
    console.error("Evaluation error:", error);
    return res.status(400).json({ error: error.message });
  }
}

export async function getEvaluationEndpoint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const evaluation = await getEvaluation(id);
    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }
    return res.json(evaluation);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getEvaluationsByMilestoneEndpoint(
  req: Request,
  res: Response
) {
  try {
    const { milestoneId } = req.params;
    const evaluations = await getEvaluationsByMilestone(milestoneId);
    return res.json(evaluations);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function updateEvaluationEndpoint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = updateEvaluationSchema.parse(req.body);
    const evaluation = await updateEvaluationResult(
      id,
      data.result,
      req.auth!.userId
    );
    return res.json(evaluation);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

// DISPUTE ENDPOINTS
export async function createDisputeEndpoint(req: Request, res: Response) {
  try {
    const data = createDisputeSchema.parse(req.body);
    const dispute = await createDispute(
      data.milestoneId,
      data.escrowAddress,
      req.auth!.userId,
      data.reason
    );

    await createNotification(
      req.auth!.userId,
      "dispute_raised",
      "Dispute Created",
      `A dispute has been raised for milestone ${data.milestoneId}`,
      `/disputes/${dispute._id}`
    );

    return res.status(201).json(dispute);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getDisputeEndpoint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dispute = await getDispute(id);
    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }
    return res.json(dispute);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getDisputesByMilestoneEndpoint(
  req: Request,
  res: Response
) {
  try {
    const { milestoneId } = req.params;
    const disputes = await getDisputesByMilestone(milestoneId);
    return res.json(disputes);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function resolveDisputeEndpoint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = resolveDisputeSchema.parse(req.body);
    const resolution = await resolveDispute(
      id,
      data.decision,
      data.reasoning,
      req.auth!.userId,
      data.paymentAdjustment
    );
    return res.json(resolution);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

// NOTIFICATION ENDPOINTS
export async function getNotificationsEndpoint(req: Request, res: Response) {
  try {
    const notifications = await getNotifications(req.auth!.userId);
    return res.json(notifications);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function markNotificationAsReadEndpoint(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const notification = await markAsRead(id);
    return res.json(notification);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getUnreadCountEndpoint(req: Request, res: Response) {
  try {
    const count = await getUnreadCount(req.auth!.userId);
    return res.json({ unreadCount: count });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function deleteNotificationEndpoint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteNotification(id);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}