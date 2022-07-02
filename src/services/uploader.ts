import { S3 } from "aws-sdk";
import { Axios, AxiosError, AxiosResponse } from 'axios'
import { bucket_name } from "../helpers/consts";
import Retry from './retry'
import { PassThrough } from "stream";

const limitMB = 5;
const timeout = 10000;

class Uploader {

    bucket: string;
    public pool: string[] = []
    private retry: Retry = new Retry();
    private request: Axios;
    private s3: S3

    constructor(s3: S3, request: Axios, bucket: string) {
        this.bucket = bucket
        this.request = request
        this.s3 = s3
    }

    public async upload(fileKey: string, fileUrl: string) {

        let fileSize = 0;

        const stream = await this.startStream(fileUrl) as AxiosResponse;
        const { passThrough, uploading } = this.writeStream(fileKey, stream)


        stream.data.pipe(passThrough);

        const result = await uploading

        return result.Location

    }

    private async startStream(fileUrl: string) {
        return this.request
            .get(fileUrl, {
                responseType: "stream",
                timeout
            })
            .catch((e: AxiosError) => {
                if (e.code === "ECONNABORTED") {
                    console.log("timeout");

                }
                return '1'
            });
    }

    private writeStream(fileKey: string, stream: AxiosResponse) {

        const passThrough = new PassThrough();



        const uploading = this.s3
            .upload({
                Bucket: this.bucket,
                Key: fileKey,
                ContentType: stream.headers["content-type"],
                ContentLength: Number(stream.headers["content-length"]),
                Body: passThrough,
            })
            .promise();


        return { passThrough, uploading };
    }

    //private async wait



}


export default (s3: S3, request: Axios, bucket: string) => new Uploader(s3, request, bucket)