import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import { protectRoute } from "../middleware/auth.middleware";

const router = Router();

/**
 * REGISTER
 */
router.post("/register", register );

/**
 * LOGIN
 */
router.post("/login", login);

export default router;
