import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import {
  submitWorkEndpoint,
  getWorkSubmissionEndpoint,
  evaluateWorkEndpoint,
  rejectWorkEndpoint,
} from "../controllers/work-submission.controller.js";

const router = Router();

router.use(requireAuth);

// POST - Submit work for a milestone
router.post("/", asyncHandler(submitWorkEndpoint));

// GET - Get work submission
router.get(
  "/:escrowAddress/:milestoneIndex",
  asyncHandler(getWorkSubmissionEndpoint)
);

// POST - Evaluate work (AI assessment)
router.post(
  "/:escrowAddress/:milestoneIndex/evaluate",
  asyncHandler(evaluateWorkEndpoint)
);

// POST - Reject work
router.post(
  "/:escrowAddress/:milestoneIndex/reject",
  asyncHandler(rejectWorkEndpoint)
);

export default router;