import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getSingleEscrow, listEscrows } from "../controllers/escrow.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", listEscrows);
router.get("/:address", getSingleEscrow);

export default router;
