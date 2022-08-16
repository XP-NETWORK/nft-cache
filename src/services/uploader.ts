import { S3 } from "aws-sdk";
import axios, { Axios, AxiosError, AxiosResponse } from "axios";
import { bucket_name } from "../helpers/consts";
import Retry from "./retry";
import { PassThrough } from "stream";

import { s3 } from "../services/s3Client";

import { parsedNft } from "../models/interfaces/nft";

const limit = 5000000; //300000;//5000000;
const timeout = 20000;
const connectionTiemout = 40000;

class Uploader {
  bucket: string;
  private retry: Retry = new Retry();
  private request: Axios;
  private s3: S3;

  constructor(s3: S3, bucket: string) {
    this.bucket = bucket;
    this.request = axios.create();
    this.s3 = s3;
  }

  async delay(time: number) {
    return new Promise((resolve) => setTimeout(() => resolve(""), time));
  }

  public async uploadAll(key: string, nft: parsedNft) {
    try {
      const [imgUrl, animUrl] = await Promise.allSettled([
        (async () => {
          return await this.upload(
            key,
            nft.metaData.image,
            nft.metaData.imageFormat
          ).catch((e) => {
            throw e;
          });
        })(),
        (async () => {
          return await this.upload(
            `${key}-video`,
            nft.metaData.animation_url,
            nft.metaData.animation_url_format || ""
          ).catch((e) => {
            throw e;
          });
        })(),
      ]);

      if (imgUrl.status === "rejected") {
        throw imgUrl.reason;
      }

      if (animUrl.status === "rejected") {
        throw animUrl.reason;
      }

      return [imgUrl.value, animUrl.value || ""];
    } catch (e) {
      throw e;
    }
  }

  public upload(fileKey: string, fileUrl: string | undefined, format: string) {
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

      let rejected = false;

      const tm = setTimeout(() => {
        rejected = true;
        reject("file fetch timeout");
      }, connectionTiemout);

      const stream = (await this.startStream(fileUrl).catch((e) =>
        reject(e)
      )) as AxiosResponse;

      if (stream) {
        //start piping bytes in bucket
        const { passThrough, uploading } = this.writeStream(
          fileKey,
          format,
          stream
        );
        stream.data.pipe(passThrough);

        //count  bytes and reject if exceede limit
        stream.data.on("data", (chunk: ArrayBuffer) => {
          tm && clearTimeout(tm);

          fileSize += Buffer.byteLength(chunk);
          if (fileSize >= limit || rejected) {
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

  private async startStream(fileUrl: string) {
    return this.request
      .get(fileUrl, {
        responseType: "stream",
        //timeout,
      })
      .catch((e: AxiosError) => {
        throw e;
      });
  }

  private writeStream(fileKey: string, format: string, stream: AxiosResponse) {
    const passThrough = new PassThrough();

    const uploading = this.s3
      .upload({
        Bucket: this.bucket,
        Key: `${fileKey}.${format}`,
        ContentType: stream.headers["content-type"],
        ContentLength: Number(stream.headers["content-length"]),
        Body: passThrough,
      })
      .promise();

    return { passThrough, uploading };
  }

  //private async wait
}

export default () => new Uploader(s3, bucket_name!);
