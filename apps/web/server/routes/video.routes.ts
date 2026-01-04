import { Router } from "express";
import { triggerProcessingVideo } from "../controllers/VideoSummarizer.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js"; 

const router = Router();

// Endpoint: POST http://localhost:8000/api/video/process/:contentId
router.post("/process/:contentId", protectRoute, triggerProcessingVideo);

export default router;