import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware";
import {
  createContentOutput,
  getContentOutputById,
} from "../controllers/content_outputs.controller";
import { triggerprocessing } from "../controllers/textsummarizer.controller";

const router = Router();

router.post("/", protectRoute, createContentOutput);
router.get("/:contentId", protectRoute, getContentOutputById);

// 🔥 PROCESS trigger
router.post("/:contentId/process", protectRoute, triggerprocessing);

export default router;