import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createContentOutput,
  getContentOutputById,
  getMyContentOutputs,
} from "../controllers/content_outputs.controller.js";
import { triggerprocessingPDF } from "../controllers/PdfSummarizer.controller.js";
import { triggerprocessingLink } from "../controllers/LinkSummarizer.controller.js";
import { triggerprocessingText } from "../controllers/textsummarizer.controller.js";

const router = Router();

router.post("/", protectRoute, createContentOutput);
router.get("/myContentOutputs", protectRoute, getMyContentOutputs);

router.get("/:contentId", protectRoute, getContentOutputById);

// 🔥 PROCESS trigger
router.post("/pdf/:contentId/process", protectRoute, triggerprocessingPDF);
router.post("/link/:contentId/process", protectRoute, triggerprocessingLink);
router.post("/text/:contentId/process", protectRoute, triggerprocessingText);

export default router;