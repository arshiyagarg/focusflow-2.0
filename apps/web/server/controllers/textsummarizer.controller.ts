import { Request, Response } from "express";
import { Content_outputsContainer } from "../lib/db.config";
import { processPDFInBackground } from "../utils/textsummarizer";

export const triggerprocessing = async (
  req: Request,
  res: Response
) => {
  console.log("🔥🔥🔥 PROCESSING ROUTE HIT 🔥🔥🔥");

  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Fetch content_outputs
    const { resource } =
      await Content_outputsContainer.item(contentId, userId).read();

    if (!resource) {
      return res.status(404).json({
        message: "Content output not found",
      });
    }

    // 2️⃣ Prevent duplicate processing
    if (resource.status === "PROCESSING") {
      return res.status(400).json({
        message: "Processing already in progress",
      });
    }

    // 3️⃣ Mark status = PROCESSING
    await Content_outputsContainer
      .item(contentId, userId)
      .patch([
        { op: "set", path: "/status", value: "PROCESSING" },
      ]);

    // 4️⃣ Fire background job (DO NOT await)
    processPDFInBackground({
      contentId,
      userId,
    });

    // 5️⃣ Respond immediately
    return res.status(202).json({
      message: "Processing started",
      contentId,
    });
  } catch (error) {
    console.error("❌ PROCESSING TRIGGER ERROR:", error);

    return res.status(500).json({
      message: "Failed to start processing",
    });
  }
};
