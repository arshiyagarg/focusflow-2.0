import { Router } from "express";
import { createOrUpdateSession, endSession } from "../controllers/session.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/createOrUpdateSession", protectRoute, createOrUpdateSession);
router.post("/endSession", protectRoute, endSession);

export default router;