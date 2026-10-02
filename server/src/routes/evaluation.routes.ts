import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import {
  submitEvidenceEndpoint,
  getEvidenceEndpoint,
  verifyEvidenceEndpoint,
  rejectEvidenceEndpoint,
  evaluateWithAIEndpoint,
  getEvaluationEndpoint,
  getEvaluationsByMilestoneEndpoint,
  updateEvaluationEndpoint,
  createDisputeEndpoint,
  getDisputeEndpoint,
  getDisputesByMilestoneEndpoint,
  resolveDisputeEndpoint,
  getNotificationsEndpoint,
  markNotificationAsReadEndpoint,
  getUnreadCountEndpoint,
  deleteNotificationEndpoint,
} from "../controllers/evaluation.controller.js";

const router = Router();
router.use(requireAuth);

// EVIDENCE
router.post("/evidence", asyncHandler(submitEvidenceEndpoint));
router.get("/evidence/:milestoneId", asyncHandler(getEvidenceEndpoint));
router.patch("/evidence/:id/verify", asyncHandler(verifyEvidenceEndpoint));
router.patch("/evidence/:id/reject", asyncHandler(rejectEvidenceEndpoint));

// AI EVALUATION
router.post("/ai-evaluate", asyncHandler(evaluateWithAIEndpoint));
router.get("/:id", asyncHandler(getEvaluationEndpoint));
router.get("/milestone/:milestoneId", asyncHandler(getEvaluationsByMilestoneEndpoint));
router.patch("/:id", asyncHandler(updateEvaluationEndpoint));

// DISPUTES
router.post("/disputes", asyncHandler(createDisputeEndpoint));
router.get("/disputes/:id", asyncHandler(getDisputeEndpoint));
router.get("/disputes/milestone/:milestoneId", asyncHandler(getDisputesByMilestoneEndpoint));
router.patch("/disputes/:id/resolve", asyncHandler(resolveDisputeEndpoint));

// NOTIFICATIONS
router.get("/notifications", asyncHandler(getNotificationsEndpoint));
router.get("/notifications/unread/count", asyncHandler(getUnreadCountEndpoint));
router.patch("/notifications/:id/read", asyncHandler(markNotificationAsReadEndpoint));
router.delete("/notifications/:id", asyncHandler(deleteNotificationEndpoint));

export default router;