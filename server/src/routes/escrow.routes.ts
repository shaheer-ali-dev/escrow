import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import { getSingleEscrow, listEscrows, buildCreateEscrow, buildCreateMilestone, buildReleaseMilestone, buildCancelEscrow, syncOnChainEscrow } from "../controllers/escrow.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(listEscrows));
router.get("/:address", asyncHandler(getSingleEscrow));
router.post("/transactions/create", asyncHandler(buildCreateEscrow));
router.post("/:address/transactions/milestones", asyncHandler(buildCreateMilestone));
router.post("/:address/transactions/release", asyncHandler(buildReleaseMilestone));
router.post("/:address/transactions/cancel", asyncHandler(buildCancelEscrow));
router.post("/:address/sync", asyncHandler(syncOnChainEscrow));
export default router;
