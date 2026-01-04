import { uploadToBlob } from "../lib/blob.config.js";

/**
 * Uploads processed AI output (summary / visual / flowchart / flashcards)
 * into the SAME content-text container as raw text.
 */
export const uploadProcessedOutput = async (
  contentId: string,
  outputStyle: "summary" | "visual" | "flowchart" | "flashcards",
  data: any
) => {
  const processedFile = {
    buffer: Buffer.from(JSON.stringify(data)),
    originalname: `${contentId}-${outputStyle}.json`,
    mimetype: "application/json",
  } as Express.Multer.File;

  // ✅ Reuse existing blob pipeline
  const { storageRef, blobName } = await uploadToBlob(processedFile, "text");

  return {
    blobName,
    storageRef,
  };
};
