import { S3 } from "aws-sdk";
import axios, { Axios, AxiosError, AxiosResponse } from "axios";
import { bucket_name } from "../helpers/consts";
import Retry from "./retry";
import { PassThrough } from "stream";

import { s3 } from "../services/s3Client";

import { parsedNft } from "../models/interfaces/nft";

const limit = 5000000; //300000;//5000000;
const timeout = 30000;
const connectionTiemout = 10000;

class Uploader {
    bucket: string;
    private retry: Retry = new Retry();
    private request: Axios;
    private s3: S3;
    private sizeLimit = limit;
    private retryCodes = "(429|503)";

    constructor(s3: S3, bucket: string) {
        this.bucket = bucket;
        this.request = axios.create({
            //timeout,
        });
        this.s3 = s3;
    }

    public setLimit(size: number) {
        this.sizeLimit = size;
    }

    async delay(time: number) {
        return new Promise((resolve) => setTimeout(() => resolve(""), time));
    }

    public async uploadAll(key: string, nft: parsedNft) {
        try {
            if (/^data:image\/svg\+xml;utf8/.test(nft.metaData.image)) {
                return [nft.metaData.image, ""];
            }

            const [imgUrl, animUrl] = await Promise.allSettled([
                (async () => {
                    return await this.upload(
                        key,
                        nft.metaData.image,
                        nft.metaData.imageFormat
                    ).catch((e) => {
                        if (
                            // new RegExp(this.retryCodes).test(e.message) &&
                            /^https:\/\/ipfs.io/.test(nft.metaData.image)
                        ) {
                            return this.upload(
                                key,
                                nft.metaData.image?.replace(
                                    /^https:\/\/ipfs.io/,
                                    "https://xpnetwork.infura-ipfs.io"
                                ),
                                nft.metaData.imageFormat
                            );
                        }

                        throw e;
                    });
                })(),
                (async () => {
                    if (!nft.metaData.animation_url) return "";
                    return await this.upload(
                        `${key}-video`,
                        nft.metaData.animation_url,
                        nft.metaData.animation_url_format || ""
                    ).catch((e) => {
                        const anim = nft.metaData.animation_url;
                        if (
                            anim &&
                            e.message?.includes("429") &&
                            /^https:\/\/ipfs.io/.test(anim)
                        ) {
                            return this.upload(
                                key,
                                anim?.replace(
                                    /^https:\/\/ipfs.io/,
                                    "https://xpnetwork.infura-ipfs.io"
                                ),
                                nft.metaData.animation_url_format || ""
                            );
                        }

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

    public upload(
        fileKey: string,
        fileUrl: string | undefined,
        format: string
    ) {
        let fileSize = 0;

        return new Promise(async (resolve, reject) => {
            if (
                !fileUrl ||
                fileUrl === "undefined" ||
                /(^ipfs|^Q|^data\:)/.test(fileUrl)
            )
                return resolve("");

            // if (this.pool.includes(fileKey)) {
            // console.log("file already in pool");
            //return resolve("");
            // }

            //this.pool.push(fileKey);

            //setTimeout(() => this.release(fileKey), 22000);

            console.log(`starting ${fileKey}, ${fileUrl}`);
            //start fetching file

            let rejected = false;

            const tm = setTimeout(() => {
                rejected = true;
                reject("file fetch timeout");
            }, connectionTiemout);

            const stream = (await this.startStream(fileUrl).catch((e) => {
                reject(e);
            })) as AxiosResponse;

            if (stream) {
                //start piping bytes in bucket
                const { passThrough, uploading } = this.writeStream(
                    fileKey,
                    format,
                    stream
                );

                passThrough.on("error", (err) => reject(undefined));
                stream.data.on("error", (err1: any) => reject(err1.code));
                stream.data.pipe(passThrough);

                stream.data.on("data", (chunk: ArrayBuffer) => {
                    tm && clearTimeout(tm);

                    fileSize += Buffer.byteLength(chunk);
                    if (rejected) {
                        stream.data?.destroy();
                        reject("");
                    }
                    if (fileSize >= this.sizeLimit) {
                        stream.data?.destroy();
                        reject("file size limit is exceeded");
                    }
                });

                //wait for finish

                const result = await uploading.catch((e: any) => reject(e));
                //clearTimeout(lastChunk);
                result && resolve(result.Location);
            }
        });
    }

    private async startStream(fileUrl: string) {
        return this.request
            .get(fileUrl, {
                responseType: "stream",
                // timeout,
            })
            .catch((e: AxiosError) => {
                throw e;
            });
    }

    private writeStream(
        fileKey: string,
        format: string,
        stream: AxiosResponse
    ) {
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
