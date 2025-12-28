import { BlobServiceClient } from "@azure/storage-blob";

import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.BLOBDB_CONNECTION_STRING;

if (!connectionString) {
  console.error("Missing Blob Storage connection string!");
}

export const blobServiceClient = connectionString 
  ? BlobServiceClient.fromConnectionString(connectionString) 
  : null as unknown as BlobServiceClient;

export const checkBlobConnection = async () => {
  if (!blobServiceClient) {
    console.error("Blob storage client not initialized. Check your .env file.");
    process.exit(1);
  }
  try {
    await blobServiceClient.getAccountInfo();
    console.log("Connection to Blob Storage successful");
  } catch (error) {
    console.error("Failed to connect to Blob Storage:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

export const ContentVideoContainerBlob = blobServiceClient?.getContainerClient("content-video");
export const ContentAudioContainerBlob = blobServiceClient?.getContainerClient("content-audio");
export const ContentTextContainerBlob = blobServiceClient?.getContainerClient("content-text");
