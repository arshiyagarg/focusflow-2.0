import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { uploadFile, getDownloadUrl } from "../controllers/blobStorage.controller";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * UPLOAD file to blob
 * POST /api/storage/upload
 */
router.post("/upload", protectRoute, upload.single("file"), uploadFile);

/**
 * GET download URL (SAS token)
 * GET /api/storage/download_url
 */
router.get("/download_url", protectRoute, getDownloadUrl);

export default router;
