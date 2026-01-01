import { Router } from "express";
import { createOrUpdateSession, endSession } from "../controllers/session.controller";
import { protectRoute } from "../middleware/auth.middleware";

const router = Router();

router.post("/createOrUpdateSession", protectRoute, createOrUpdateSession);
router.post("/endSession", protectRoute, endSession);

export default router;