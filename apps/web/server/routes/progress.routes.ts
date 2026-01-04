import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getOrInitProgress } from "../controllers/progress.controller.js";

const router = Router();

router.get("/me", protectRoute, getOrInitProgress);

export default router;
