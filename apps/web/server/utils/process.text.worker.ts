import { OutputStyle } from "../types/textprocessing";
import {
  processSummary,
} from "../processors/summary.processor";
import {
  processVisual,
} from "../processors/visual.processor";
import {
  processFlowchart,
} from "../processors/flowchart.processor";
import {
  processFlashcards,
} from "../processors/flashcard.processor";
import { Content_outputsContainer } from "../lib/db.config";

export const processTextWorker = async ({
  contentId,
  userId,
  outputStyle,
  text,
  preferences,
}: {
  contentId: string;
  userId: string;
  outputStyle: OutputStyle;
  text: string;
  preferences: any;
}) => {
  try {
    console.log("[Worker] Started", { contentId, outputStyle });

    switch (outputStyle) {
      case "summary":
        await   processSummary({ contentId, userId, text, preferences });
        break;

      case "visual":
        await   processVisual({ contentId, userId, text, preferences });
        break;

      case "flowchart":
        await   processFlowchart({ contentId, userId, text, preferences });
        break;

      case "flashcards":
        await   processFlashcards({ contentId, userId, text, preferences });
        break;

      default:
        throw new Error(`Unsupported outputStyle: ${outputStyle}`);
    }
  } catch (err: any) {
    console.error("[Worker] FAILED", err);

    await Content_outputsContainer.item(contentId, userId).patch([
      { op: "set", path: "/status", value: "FAILED" },
      {
        op: "set",
        path: "/errorMessage",
        value: err.message || "Processing failed",
      },
    ]);
  }
};
