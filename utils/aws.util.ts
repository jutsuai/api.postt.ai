import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const bucketName = process.env.AWS_BUCKET_NAME;

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

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
