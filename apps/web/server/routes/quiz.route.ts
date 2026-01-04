import { Router } from "express";
import { generateQuiz } from "../controllers/quiz.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// Protect this so only logged-in users can generate quizes
router.post("/generate-quiz", protectRoute, generateQuiz);

export default router;