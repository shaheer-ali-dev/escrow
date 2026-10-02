import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/async.middleware.js";
import {
  searchFreelancersEndpoint,
  getTopFreelancersEndpoint,
  getFreelancerProfileEndpoint,
  updateFreelancerProfileEndpoint,
  createFreelancerProfileEndpoint,
} from "../controllers/freelancer-search.controller.js";

const router = Router();

// Public routes
router.get("/search", asyncHandler(searchFreelancersEndpoint));
router.get("/top", asyncHandler(getTopFreelancersEndpoint));
router.get("/:walletAddress", asyncHandler(getFreelancerProfileEndpoint));

// Protected routes
router.use(requireAuth);
router.post("/profile", asyncHandler(createFreelancerProfileEndpoint));
router.patch("/profile", asyncHandler(updateFreelancerProfileEndpoint));

export default router;