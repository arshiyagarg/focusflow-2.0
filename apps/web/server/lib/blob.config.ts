import { BlobServiceClient } from "@azure/storage-blob";

import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.BLOBDB_CONNECTION_STRING;
console.log(connectionString);

export const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

export const checkBlobConnection = async () => {
  try {
    const blobresponse = await blobServiceClient.getAccountInfo();
   
    console.log("Blob Storage connected !!");
    console.log(blobresponse);
    //return true;
  } catch (error) {
    //return false;
    console.log("Blob storage not connected ");
    console.log(error);
    process.exit(1);
  }
};



