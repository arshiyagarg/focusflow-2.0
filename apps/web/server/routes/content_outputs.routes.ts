import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware";
import {
  createContentOutput,
  getContentOutputById,
} from "../controllers/content_outputs.controller";
import { triggerprocessingPDF } from "../controllers/PdfSummarizer.controller";
import { triggerprocessingLink } from "../controllers/LinkSummarizer.controller";
import { triggerprocessingText } from "../controllers/textsummarizer.controller";

const router = Router();

router.post("/", protectRoute, createContentOutput);
router.get("/:contentId", protectRoute, getContentOutputById);

// 🔥 PROCESS trigger
router.post("/pdf/:contentId/process", protectRoute, triggerprocessingPDF);
router.post("/link/:contentId/process", protectRoute, triggerprocessingLink);
router.post("/text/:contentId/process", protectRoute, triggerprocessingText);

export default router;