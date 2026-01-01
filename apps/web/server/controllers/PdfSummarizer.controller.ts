import { Request, Response } from "express";
import { Content_outputsContainer } from "../lib/db.config";
//import { processPDFInBackground } from "../utils/PdfSummarizer";
import { getOutputStyleOrDefault } from "../utils/valid_get_outputstyles";
//import { processTextWorker } from "../utils/process.text.worker";
import { processPDFInBackground } from "../utils/PdfSummarizer";
import { getUserPreferences } from "../utils/getUserPreferences";
export const triggerprocessingPDF = async (
  req: Request,
  res: Response
) => {
  console.log(`[PDF Controller] ${new Date().toISOString()} - Triggering processing for contentId: ${req.params.contentId}`);

  try {
    const { contentId } = req.params;
    const userId = req.user.id;
    const outputStyle = getOutputStyleOrDefault(req.body?.outputStyle);

    // 1️⃣ Fetch content_outputs
    const { resource } = await Content_outputsContainer.item(contentId, userId).read();

    if (!resource) {
      console.warn(`[PDF Controller] Content not found for contentId: ${contentId}`);
      return res.status(404).json({
        message: "Content output not found",
      });
    }

    // 2️⃣ Prevent duplicate processing
    if (resource.status === "PROCESSING") {
      console.log(`[PDF Controller] contentId: ${contentId} is already being processed.`);
      return res.status(400).json({
        message: "Processing already in progress",
      });
    }

    if (resource.status === "READY") {
      console.log(`[PDF Controller] contentId: ${contentId} is already processed.`);
      return res.status(200).json({
        message: "Content already processed",
        contentId,
      });
    }

    // 3️⃣ Mark status = PROCESSING
    await Content_outputsContainer
      .item(contentId, userId)
      .patch([
        { op: "set", path: "/status", value: "PROCESSING" },
        { op: "set", path: "/outputStyle", value: outputStyle },
      ]);
    console.log(`[PDF Controller] Marked status as PROCESSING for contentId: ${contentId}`);

    //const extractedText = await extractTextFromPDF(pdfBuffer);


    const preferences = await getUserPreferences(userId);

    processPDFInBackground({
      contentId,
      userId,
      outputStyle,
      initialResource: resource,
    });

    // 4️⃣ Fire background job (DO NOT await)
    // processPDFInBackground({
    //   contentId,
    //   userId,
    // });
    console.log(`[PDF Controller] Dispatched background job for contentId: ${contentId}`);

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
