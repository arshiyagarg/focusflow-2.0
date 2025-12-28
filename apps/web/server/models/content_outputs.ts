// models/ContentOutput.ts

export type InputType = "audio" | "video" | "text";

export interface content_outputs {
  id: string;                 // Cosmos DB required field (same as contentId)
  contentId: string;          // explicit content identifier
  userId: string;             // partition key (recommended)

  inputType: InputType;       // audio | video | text
  storageRef: string;         // Blob Storage URL

  createdAt: string;          // ISO timestamp

  type: "CONTENT_OUTPUT";     // useful for polymorphic queries
}
