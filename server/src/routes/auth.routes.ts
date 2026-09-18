import { Router } from "express";
import { signupUser, loginUser } from "../controllers/auth.controller.js";
import { googleStart, googleCallback } from "../controllers/oauth.controller.js";
import { asyncHandler } from "../middleware/async.middleware.js";

const router = Router();
router.post("/signup", asyncHandler(signupUser));
router.post("/login", asyncHandler(loginUser));
router.get("/google", googleStart);
router.get("/google/callback", googleCallback);
export default router;
