import { Request, Response } from "express";
import { Content_outputsContainer } from "../lib/db.config";
//import { processTextInBackground } from "../utils/textsummarizer";
import { processTextWorker } from "../utils/process.text.worker";

import { getOutputStyleOrDefault } from "../utils/valid_get_outputstyles";

import { OutputStyle } from "../types/textprocessing";
import { getUserPreferences } from "../utils/getUserPreference";



export const triggerprocessingText = async (
  req: Request,
  res: Response
) => {
  console.log(`[Text Controller] ${new Date().toISOString()} - Triggering processing for contentId: ${req.params.contentId}`);

  try {
    const { contentId } = req.params;
    const userId = req.user.id;
    const outputStyle: OutputStyle = getOutputStyleOrDefault(
      req.body?.outputStyle
    );
    console.log(`[Text Controller] userId from req.user: ${userId}, contentId: ${contentId}, outputStyle=${outputStyle}`);

    // 1️⃣ Fetch content_outputs
    const { resource } =
      await Content_outputsContainer.item(contentId, userId).read();

    if (!resource) {
      console.warn(`[Text Controller] Content not found for contentId: ${contentId}`);
      return res.status(404).json({
        message: "Content output not found",
      });
    }

    // 2️⃣ Prevent duplicate processing
    // if (resource.status === "PROCESSING") {
    //   console.log(`[Text Controller] contentId: ${contentId} is already being processed.`);
    //   return res.status(400).json({
    //     message: "Processing already in progress",
    //   });
    // }
    const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

    if (resource.status === "PROCESSING") {
      const startedAt = resource.processingStartedAt
        ? new Date(resource.processingStartedAt).getTime()
        : 0;

      const isStale = Date.now() - startedAt > PROCESSING_TIMEOUT_MS;

      if (!startedAt || isStale) {
        console.warn("[Controller] Stale PROCESSING detected, resetting");

        await Content_outputsContainer.item(contentId, userId).patch([
          { op: "set", path: "/status", value: "FAILED" },
          {
            op: "set",
            path: "/errorMessage",
            value: "Auto-reset after processing timeout",
          },
        ]);
      } else {
        return res.status(400).json({
          message: "Processing already in progress",
        });
      }
    }

    if (resource.status === "READY") {
      console.log(`[Text Controller] contentId: ${contentId} is already processed.`);
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
        { op: "set", path: "/processingStartedAt", value: new Date().toISOString() }

      ]);
    console.log(`[Text Controller] Marked status as PROCESSING for contentId: ${contentId}`);

    // 4️⃣ Fire background job (DO NOT await)
    const extractedText =
      typeof resource.rawStorageRef === "string"
        ? resource.rawStorageRef
        : "";

    if (!extractedText) {
      return res.status(400).json({
        message: "No text found to process",
      });
    }
     // 6️⃣ User preferences
    const preferences = await getUserPreferences(userId);

    // 7️⃣ Fire worker (DO NOT await)
    processTextWorker({
      contentId,
      userId,
      outputStyle,
      text: extractedText,
      preferences,
    });


    console.log(`[Text Controller] Dispatched background job for contentId: ${contentId}`);

    // 5️⃣ Respond immediately
    return res.status(202).json({
      message: "Processing started",
      contentId,
      outputStyle,
    });
  } catch (error) {
    console.error("❌ PROCESSING TRIGGER ERROR:", error);

    return res.status(500).json({
      message: "Failed to start processing",
    });
  }
};
