import axios from "axios";
import { uploadToBlob } from "../lib/blob.config";
import { Content_outputsContainer } from "../lib/db.config";
import { downloadBlobAsBuffer } from "../utils/blobDownloadHelper";

// ✅ CORRECT pdfjs import for Node 20 + ESM
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import { GoogleGenerativeAI } from "@google/generative-ai";

console.log(`[Summarizer Config] HF_API_TOKEN status: ${process.env.HF_API_TOKEN ? "PRESENT" : "MISSING"}`);
console.log(`[Summarizer Config] GEMINI_API_KEY status: ${process.env.GEMINI_API_KEY ? "PRESENT" : "MISSING"}`);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: { 
    responseMimeType: "application/json" // 🔥 forces valid JSON
  }
});

export const processPDFInBackground = async ({
  contentId,
  userId,
}: {
  contentId: string;
  userId: string;
}) => {
  console.log(`[PDF Worker] ${new Date().toISOString()} - Starting worker for contentId: ${contentId}`);
  try {
    const { resource } =
      await Content_outputsContainer.item(contentId, userId).read();

    if (!resource) throw new Error("Content not found");

    const pdfBuffer = await downloadBlobAsBuffer(
      resource.rawStorageRef
    );
    console.log(`[PDF Worker] Downloaded PDF content for contentId: ${contentId}`);

    await processPDFToBionic({
      contentId,
      userId,
      pdfBuffer,
    });
  } catch (err: any) {
    await Content_outputsContainer
      .item(contentId, userId)
      .patch([
        { op: "set", path: "/status", value: "FAILED" },
        { op: "set", path: "/errorMessage", value: err.message },
      ]);
  }
};

/**
 * Extract text from PDF using pdfjs-dist
 */
export const extractTextFromPDF = async (
  pdfBuffer: Buffer
): Promise<string> => {
  const data = new Uint8Array(pdfBuffer);

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");

    fullText += pageText + "\n";
  }

  if (!fullText.trim()) {
    throw new Error("PDF contains no extractable text");
  }

  return fullText;
};

/**
 * Chunk long text for summarization
 */
export const chunkText = (
  text: string,
  chunkSize = 3000
): string[] => {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize;
  }

  return chunks;
};

/**
 * Summarize text using Hugging Face (FREE tier compatible)
 */
export const summarizeText = async (
  text: string
): Promise<string> => {
  console.log(`[Summarizer] Summarizing with Gemini...`);
  
  const chunks = chunkText(text);
  const summaryPromises = chunks.map(async (chunk, index) => {
    try {
      console.log(`[Summarizer] Processing chunk ${index + 1}/${chunks.length}...`);
      const response = await axios.post(
        "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn",
        { inputs: chunk },
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 60_000,
        }
      );

      if (!Array.isArray(response.data)) {
        throw new Error(
          `Unexpected HF response: ${JSON.stringify(response.data)}`
        );
    }

      return response.data[0].summary_text;
  } catch (error: any) {
      console.error(`[Summarizer] Error in chunk ${index + 1}:`, error.message);
    throw error;
  }
  });

  const summaries = await Promise.all(summaryPromises);
  return summaries.join("\n\n");
};

/**
 * Convert summary to Bionic Reading JSON (Azure OpenAI)
 */
export const generateBionicJSON = async (
  summary: string
): Promise<any> => {
  const prompt = `
You convert text into Bionic Reading format.

RULES:
- Return STRICT JSON only
- Do NOT include markdown or explanations
- Bold the first 40% of each word using <b></b>
- Group output into paragraphs and sentences
- Output must be valid JSON

JSON FORMAT:
{
  "paragraphs": [
    {
      "sentences": [
        { "text": "<b>Thi</b>s is an <b>exa</b>mple." }
      ]
    }
  ]
}

TEXT:
${summary}
`;

  const result = await model.generateContent(prompt);

  const responseText = result.response.text();

  if (!responseText) {
    throw new Error("Gemini returned empty response");
  }

  // 🔐 responseMimeType ensures this is valid JSON
  const parsed = JSON.parse(responseText);
  console.log(`[PDF Pipeline] Generated Bionic JSON structure.`);
  return parsed;
};

/**
 * ⭐ FULL PIPELINE: PDF → Summary → Bionic → Blob → Cosmos
 */
export const processPDFToBionic = async ({
  contentId,
  userId,
  pdfBuffer,
}: {
  contentId: string;
  userId: string;
  pdfBuffer: Buffer;
}) => {
  console.time(`[PDF Pipeline] ${contentId}`);
  console.log(`[PDF Pipeline] ${new Date().toISOString()} - Processing contentId: ${contentId}`);
  try {
    // 1️⃣ Extract text
    const rawText = await extractTextFromPDF(pdfBuffer);

    // 2️⃣ Summarize
    const summary = await summarizeText(rawText);

    // 3️⃣ Generate Bionic JSON
    const bionicJSON = await generateBionicJSON(summary);

    // 4️⃣ Upload processed JSON to Blob
    const processedFile = {
      buffer: Buffer.from(JSON.stringify(bionicJSON)),
      originalname: `${contentId}-bionic.json`,
      mimetype: "application/json",
    } as Express.Multer.File;

    const { storageRef, blobName } = await uploadToBlob(
      processedFile,
      "text"
    );
    console.log(`[PDF Pipeline] ${new Date().toISOString()} - Upload to Blob finished.`);

    // 5️⃣ Update Cosmos DB
    const { resource } =
      await Content_outputsContainer.item(contentId, userId).read();

    if (!resource) {
      throw new Error("Content output not found");
    }

    resource.processedStorageRef = storageRef;
    resource.processedBlobName = blobName;
    resource.processedContainerName = "content-processed";
    resource.outputFormat = "BIONIC_TEXT";
    resource.status = "READY";
    resource.processedAt = new Date().toISOString();

    await Content_outputsContainer
      .item(contentId, userId)
      .replace(resource);

    console.log(`[PDF Pipeline] ${new Date().toISOString()} - Process completed for contentId: ${contentId}`);
    console.timeEnd(`[PDF Pipeline] ${contentId}`);
    return resource;

  } catch (error: any) {
    console.error("[PDF Processing Error]", error.message);

    await Content_outputsContainer
      .item(contentId, userId)
      .patch([
        { op: "set", path: "/status", value: "FAILED" },
        {
          op: "set",
          path: "/errorMessage",
          value: error.message || "PDF processing failed",
        },
      ]);

    throw error;
  }
};
