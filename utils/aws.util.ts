import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const bucketName = process.env.AWS_BUCKET_NAME;

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

// Assuming s3Client is already initialized as shown in the original code.

export const AWSDelete = async (url: string) => {
  try {
    const urlParts = new URL(url);

    // let bucketName, key;
    const bucketName = process.env.AWS_BUCKET_NAME;
    let key = urlParts.pathname.substring(14);

    console.log("=========================", urlParts);
    console.log("======================== key =", key);

    // // Handle virtual-hosted style (e.g., https://bucket.s3.region.amazonaws.com/key)
    // if (urlParts.hostname.includes(".s3")) {
    //   bucketName = urlParts.hostname.split(".s3")[0]; // Extract bucket name
    //   key = decodeURIComponent(urlParts.pathname.substring(1)); // Extract key (remove leading "/")
    // }
    // // Handle path-style (e.g., https://s3.region.amazonaws.com/bucket/key)
    // else if (urlParts.hostname.startsWith("s3.") && urlParts.pathname) {
    //   const pathParts = urlParts.pathname.split("/").filter(Boolean); // Remove leading/trailing slashes
    //   bucketName = pathParts[0]; // First part of the path is the bucket name
    //   key = decodeURIComponent(pathParts.slice(1).join("/")); // Remaining parts are the key
    // } else {
    //   console.log("URL is not an AWS S3 URL.");
    //   return { success: false, message: "URL is not an AWS S3 URL." };
    // }

    if (!bucketName || !key) {
      console.log("Invalid URL format.");
      return { success: false, message: "Invalid URL format." };
    }

    // Check if the file exists before attempting to delete
    try {
      await s3Client.send(
        new HeadObjectCommand({ Bucket: bucketName, Key: key })
      );
    } catch (headError: any) {
      if (headError.name === "NotFound") {
        console.log("File does not exist.");
        return { success: false, message: "File does not exist." };
      } else {
        console.log("Error checking file existence:", headError.message);
        return {
          success: false,
          message: `Error checking file existence: ${headError.message}`,
        };
      }
    }

    // Delete the file
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: key })
    );
    console.log(`File ${key} deleted successfully.`);
    return { success: true, message: `File ${key} deleted successfully.` };
  } catch (error: any) {
    console.log("AWS Delete Error:", error.message);
    return {
      success: false,
      message: `Failed to delete file: ${error.message}`,
    };
  }
};

export const AWSPut = async (params: any) => {
  const payload = {
    Bucket: bucketName,
    // Key: params.key,
    // Body: params.content,
    // ContentType: params.contentType,
    ContentEncoding: "base64",
    ACL: "public-read",

    ...params,
  };

  try {
    await s3Client.send(new PutObjectCommand(payload));

    return `https://s3.${process.env.AWS_REGION}.amazonaws.com/${bucketName}/${params.Key}`;
  } catch (err: any) {
    console.log("AWS Put Error: ", err.message);
    throw new Error(`Failed to upload: ${err.message}`);
  }
};

export const AWSUpload = async (params: any) => {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      // Key: params.key,
      // Body: params.content,
      // ContentType: params.contentType,
      ContentEncoding: "base64",
      ACL: "public-read", // or another ACL according to your requirements

      ...params,
    },
    leavePartsOnError: false,
    queueSize: 4,
    partSize: 10 * 1024 * 1024,
  });

  try {
    await upload.done();
    return `https://${bucketName}.s3.amazonaws.com/${params.Key}`;
  } catch (error: any) {
    console.log("AWS Upload Error: ", error.message);

    console.log(error);
    console.log(params.Key);

    return "https://placehold.co/512x512/EEE/31343C?text=Placeholder";
    // throw new Error(`Failed to upload: ${error.message}`);
  }
};
