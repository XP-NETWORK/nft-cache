//import { S3Client } from "@aws-sdk/client-s3";
import AWS from 'aws-sdk'
require('dotenv').config()
const REGION = "eu-west-1"; //e.g. "us-east-1"
import { secret_key, access_key } from '../helpers/consts';
// Create an Amazon S3 service client object.

const s3 = new AWS.S3({
    region: REGION,
    credentials: {
        accessKeyId: access_key || "",
        secretAccessKey: secret_key || ""
    }
});
export { s3 };