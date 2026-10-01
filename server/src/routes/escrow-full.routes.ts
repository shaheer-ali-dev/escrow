import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import {
  createEscrowEndpoint,
  createMilestoneEndpoint,
  releaseMilestoneEndpoint,
  cancelEscrowEndpoint,
  syncEscrowEndpoint,
} from "../controllers/escrow-create.controller.js";
import { listEscrows, getSingleEscrow } from "../controllers/escrow.controller.js";

const router = Router();

// Protected routes
router.use(requireAuth);

// GET routes
router.get("/", asyncHandler(listEscrows));
router.get("/:address", asyncHandler(getSingleEscrow));

// POST - Create escrow
router.post("/", asyncHandler(createEscrowEndpoint));

// POST - Create milestone
router.post("/:address/milestones", asyncHandler(createMilestoneEndpoint));

// POST - Release milestone
router.post(
  "/:address/milestones/:index/release",
  asyncHandler(releaseMilestoneEndpoint)
);

// POST - Cancel escrow
router.post("/:address/cancel", asyncHandler(cancelEscrowEndpoint));

// POST - Sync on-chain transaction
router.post("/:address/sync", asyncHandler(syncEscrowEndpoint));

export default router;