import { Evaluation } from "../models/evaluation.model.js";

interface Check {
  name: string;
  passed: boolean;
  details: string;
}

export async function createEvaluation(
  milestoneId: string,
  escrowAddress: string,
  evidenceId: string,
  checks: Check[],
  confidenceScore: number,
  reasoning: string
) {
  const passedChecks = checks.filter((c) => c.passed).length;
  const totalChecks = checks.length;
  const deterministic = confidenceScore >= 95;
  const result =
    passedChecks === totalChecks
      ? "pass"
      : passedChecks / totalChecks >= 0.8
        ? "needs_review"
        : "fail";

  return Evaluation.create({
    milestoneId,
    escrowAddress,
    evidenceId,
    checks,
    confidenceScore,
    deterministic,
    result,
    reasoning,
    evaluationType: "ai",
    evaluatedAt: new Date(),
  });
}

export async function getEvaluation(evaluationId: string) {
  return Evaluation.findById(evaluationId).lean();
}

export async function getEvaluationsByMilestone(milestoneId: string) {
  return Evaluation.find({ milestoneId }).sort({ evaluatedAt: -1 }).lean();
}

export async function updateEvaluationResult(
  evaluationId: string,
  result: "pass" | "fail" | "needs_review",
  evaluatedBy: string
) {
  return Evaluation.findByIdAndUpdate(
    evaluationId,
    {
      result,
      evaluationType: "manual",
      evaluatedBy,
      evaluatedAt: new Date(),
    },
    { new: true }
  );
}