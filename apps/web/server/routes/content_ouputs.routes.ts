import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware";
// import {
//   createContentOutput,
//   getMyContentOutputs,
//   getContentOutputById,
//   deleteContentOutput,
// } from "../controllers/content_outputs.controller";
import {
    createContentOutput, 
    getMyContentOutputs,
    getContentOutputById,
    deleteContentOutput

}from "../controllers/content_outputs.controller";

const router = Router();

/**
 * CREATE content output
 * POST /api/content-outputs
 */
router.post("/", protectRoute, createContentOutput);

/**
 * GET all content outputs for logged-in user
 * GET /api/content-outputs/me
 */
router.get("/me", protectRoute, getMyContentOutputs);

/**
 * GET single content output by contentId
 * GET /api/content-outputs/:contentId
 */
router.get("/:contentId", protectRoute, getContentOutputById);

/**
 * DELETE content output
 * DELETE /api/content-outputs/:contentId
 */
router.delete("/:contentId", protectRoute, deleteContentOutput);

export default router;
