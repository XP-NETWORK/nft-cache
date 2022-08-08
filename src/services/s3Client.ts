//import { S3Client } from "@aws-sdk/client-s3";
import AWS, { S3 } from "aws-sdk";
import { config } from "dotenv";
const REGION = "eu-west-1"; //e.g. "us-east-1"
import { secret_key, access_key } from "../helpers/consts";
import { S3Client } from "@aws-sdk/client-s3";
// Create an Amazon S3 service client object.

const s3 = new S3({
  region: REGION,
  credentials: {
    accessKeyId: access_key || "",
    secretAccessKey: secret_key || "",
  },
});
export { s3 };
