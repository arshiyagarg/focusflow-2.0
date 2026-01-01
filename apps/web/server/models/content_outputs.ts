// models/ContentOutput.ts

export type InputType = "audio" | "video" | "text";

export type ProcessingStatus =
  | "UPLOADED"      // raw file uploaded
  | "PROCESSING"    // OpenAI / pipeline running
  | "READY"         // processed output ready
  | "FAILED";       // processing failed

export type OutputFormat =
  | "BIONIC_TEXT"
  | "SOCRATIC_QA"
  | "FLOWCHART"
  | "SUMMARY"
  | "TRANSCRIPT";

export interface Content_outputs {
  /** Cosmos DB required fields */
  id: string;                 // same as contentId
  contentId: string;
  userId: string;             // partition key

  /** Input metadata */
  inputType: InputType;       // audio | video | text
  rawStorageRef: string;      // blob URL of original file (PDF / video / audio)

  /** Processed output (IMPORTANT) */
  processedStorageRef?: string; // blob URL of processed JSON (Bionic / Socratic)
  outputFormat?: OutputFormat;  // what kind of learning artifact this is

  /** Blob metadata for processed output */
  processedBlobName?: string;
  processedContainerName: string; // e.g. content-processed

  /** Processing lifecycle */
  status: ProcessingStatus;
  errorMessage?: string;

  /** Timestamps */
  createdAt: string;
  processedAt?: string;

  /** Discriminator */
  type: "CONTENT_OUTPUT";
}
