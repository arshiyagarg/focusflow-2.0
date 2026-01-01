import { uploadToBlob } from "../lib/blob.config";
import { Content_outputsContainer } from "../lib/db.config";
import { VISUAL_PROMPT } from "./prompts";
import { OutputStyle } from "../types/textprocessing";

import { GoogleGenerativeAI } from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.3,
  },
});



export const processVisual = async ({
  contentId,
  userId,
  text,
  preferences,
}: {
  contentId: string;
  userId: string;
  text: string;
  preferences: any;
}) => {
  const outputStyle: OutputStyle = "visual";

  const prompt = VISUAL_PROMPT(text, preferences);
  const result = await geminiModel.generateContent(prompt);

  const generatedOutput = JSON.parse(result.response.text());

  const processedFile = {
    buffer: Buffer.from(JSON.stringify(generatedOutput)),
    originalname: `${contentId}-${outputStyle}.json`,
    mimetype: "application/json",
  } as Express.Multer.File;

  const { storageRef, blobName } = await uploadToBlob(processedFile, "text");

  await Content_outputsContainer.item(contentId, userId).patch([
    { op: "set", path: "/processedBlobName", value: blobName },
    { op: "set", path: "/processedStorageRef", value: storageRef },
    { op: "set", path: "/processedContainerName", value: "content-text" },
    { op: "set", path: "/outputStyle", value: outputStyle },
    { op: "set", path: "/status", value: "READY" },
    { op: "set", path: "/processedAt", value: new Date().toISOString() },
  ]);
};
