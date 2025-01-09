import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

// const S3_FILE_EXPIRES_IN = 432000; // 5 days

export const uploadFileToS3 = async ({
  bucket,
  buffer,
  key,
  contentType,
}: {
  bucket: string | undefined;
  buffer: Buffer;
  key: string;
  contentType: string;
}) => {
  try {
    const uploadParams = {
      Bucket: bucket,
      Key: "local/" + key,
      Body: buffer,
      ContentType: contentType,
    };

    console.log(
      "uploadParams : ",
      process.env.AWS_ACCESS_KEY_ID,
      "=============",
      process.env.AWS_SECRET_ACCESS_KEY
    );
    console.log("uploadParams : ", uploadParams);

    const command = new PutObjectCommand(uploadParams as any);
    console.log("==================command : ");
    s3.send(command)
      .then((data) => {
        console.log("data : ", data);
      })
      .catch((error) => {
        console.error("Error uploading file to S3:", error);
        throw new Error("Failed to upload file to S3");
      });

    // try {
    //   const response = await s3.send(command);
    //   console.log("responce : ", response);
    // } catch (error) {
    //   console.error("Error uploading file to S3:", error);
    //   throw new Error("Failed to upload file to S3");
    // }
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }

  //   return key;
  //   return generateSignedUrl(bucket as string, key);
};
