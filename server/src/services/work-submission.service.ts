import { WorkSubmission } from "../models/work-submission.model.js";

export async function submitWork(
  escrowAddress: string,
  milestoneIndex: number,
  freelancer: string,
  submissionUri: string,
  description: string,
  evidenceHashes: string[]
) {
  const submission = await WorkSubmission.create({
    escrowAddress,
    milestoneIndex,
    freelancer,
    submissionUri,
    description,
    evidenceHashes,
    status: "submitted",
  });

  return submission;
}

export async function getWorkSubmission(
  escrowAddress: string,
  milestoneIndex: number
) {
  return WorkSubmission.findOne({
    escrowAddress,
    milestoneIndex,
  }).lean();
}

export async function evaluateWork(
  escrowAddress: string,
  milestoneIndex: number,
  score: number,
  result: string
) {
  return WorkSubmission.findOneAndUpdate(
    { escrowAddress, milestoneIndex },
    {
      status: "evaluated",
      aiEvaluationScore: score,
      aiEvaluationResult: result,
      evaluatedAt: new Date(),
    },
    { new: true }
  );
}

export async function rejectWork(
  escrowAddress: string,
  milestoneIndex: number,
  reason: string
) {
  return WorkSubmission.findOneAndUpdate(
    { escrowAddress, milestoneIndex },
    {
      status: "rejected",
      aiEvaluationResult: reason,
      evaluatedAt: new Date(),
    },
    { new: true }
  );
}