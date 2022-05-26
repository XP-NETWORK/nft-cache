//import { S3Client } from "@aws-sdk/client-s3";
import AWS from 'aws-sdk'
require('dotenv').config()
const REGION = "eu-west-1"; //e.g. "us-east-1"

// Create an Amazon S3 service client object.

const s3 = new AWS.S3 ({ region: REGION,
    credentials:{
        accessKeyId:process.env.access_key||"",
        secretAccessKey:process.env.secret_key||""
    } });
export { s3 };