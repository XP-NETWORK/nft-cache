import { S3 } from "aws-sdk";
import axios, { Axios, AxiosError, AxiosResponse } from "axios";
import { bucket_name } from "../helpers/consts";
import Retry from "./retry";
import { PassThrough } from "stream";
import { resolve } from "path/posix";

import { s3 } from "../services/s3Client";

const limit = 5000000; //300000;//5000000;
const timeout = 20000;

class Uploader {
  bucket: string;
  public pool: {
    key: string;
    data: any;
  }[] = [];
  private retry: Retry = new Retry();
  private request: Axios;
  private s3: S3;

  constructor(s3: S3, request: Axios, bucket: string) {
    this.bucket = bucket;
    this.request = request;
    this.s3 = s3;
  }

  public upload(fileKey: string, fileUrl: string | undefined) {
    let fileSize = 0;

    return new Promise(async (resolve, reject) => {
      if (!fileUrl || /(^ipfs|^Q|^data\:)/.test(fileUrl))
        return resolve(undefined);

      // if (this.pool.includes(fileKey)) {
      // console.log("file already in pool");
      //return resolve("");
      // }

      //this.pool.push(fileKey);

      //setTimeout(() => this.release(fileKey), 22000);

      console.log(`starting ${fileKey}`);
      //start fetching file
      const stream = (await this.startStream(fileUrl).catch((e) =>
        reject(e)
      )) as AxiosResponse;

      if (stream) {
        //start piping bytes in bucket
        const { passThrough, uploading } = this.writeStream(fileKey, stream);
        stream.data.pipe(passThrough);

        //count  bytes and reject if exceede limit
        stream.data.on("data", (chunk: ArrayBuffer) => {
          fileSize += Buffer.byteLength(chunk);
          if (fileSize >= limit) {
            stream.data?.destroy();
            reject("file size limit is exceeded");
          }
        });

        //wait for finish
        const result = await uploading.catch((e) => reject(e));
        result && resolve(result.Location);
      }
    });
  }

  public release(fileKey: string) {
    if (!this.pool.length) return;
    const idx = this.pool.findIndex((item) => item.key === fileKey);

    if (idx > -1) {
      this.pool.splice(idx, 1);
    }

    console.log(this.pool, "this.pool");
  }

  private async startStream(fileUrl: string) {
    return this.request
      .get(fileUrl, {
        responseType: "stream",
        timeout,
      })
      .catch((e: AxiosError) => {
        if (e.code === "ECONNABORTED") {
          throw new Error("file fetch timeout");
        }
        throw e;
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

export let uploader = new Uploader(s3, axios.create(), bucket_name!);
export type { Uploader };

/*export default (s3: S3, request: Axios, bucket: string) =>
  new Uploader(s3, request, bucket);*/