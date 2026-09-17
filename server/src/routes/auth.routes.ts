import { Router } from "express";
import { signupUser, loginUser, googleStart, googleCallback } from "../controllers/auth.controller.js";
const router = Router(); router.post("/signup", signupUser); router.post("/login", loginUser); router.get("/google", googleStart); router.get("/google/callback", googleCallback); export default router;
