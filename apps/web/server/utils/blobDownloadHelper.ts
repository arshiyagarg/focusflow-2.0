import { BlobServiceClient } from "@azure/storage-blob";

console.log(`[Blob Download Helper] Initialization - Connection String: ${process.env.BLOBDB_CONNECTION_STRING ? "LOADED" : "MISSING"}`);
const connectionString = process.env.BLOBDB_CONNECTION_STRING;
console.log(`[Blob Download Helper] Initialization - Connection String: ${connectionString ? "LOADED" : "MISSING"}`);

const blobServiceClient = connectionString 
  ? BlobServiceClient.fromConnectionString(connectionString)
  : null;

export const downloadBlobAsBuffer = async (
  blobUrl: string
): Promise<Buffer> => {
  if (!blobServiceClient) {
    throw new Error("BlobServiceClient not initialized. Check BLOBDB_CONNECTION_STRING.");
  }
  const url = new URL(blobUrl);

  const containerName = url.pathname.split("/")[1];

  // 🔥 CRITICAL FIX: decode blob name ONCE
  const blobName = decodeURIComponent(
    url.pathname.split("/").slice(2).join("/")
  );

  const containerClient =
    blobServiceClient.getContainerClient(containerName);

  const blobClient = containerClient.getBlobClient(blobName);

  const downloadResponse = await blobClient.download();

  const chunks: Buffer[] = [];
  for await (const chunk of downloadResponse.readableStreamBody!) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks);
};
