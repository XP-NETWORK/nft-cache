import NFT, { INFT } from "../models/nft";
import { s3 } from "../services/s3Client";
import { bucket_name, bot, chat_id } from "../helpers/consts";
import {
  dataToNFTObj,
  dataToParams,
  paramsForFile,
  dataToNFTObjFile,
} from "../helpers/helpers";
import axios, { AxiosError, AxiosResponse } from "axios";

import request from "request";
//import e from 'connect-timeout';
import stream, { PassThrough, Readable } from "stream";
import { Request, Response } from "express";

import BigNumber from "bignumber.js";

import { S3 } from "aws-sdk";

import Uploader from "../services/uploader";
import { parsedNft } from "../models/interfaces/nft";

export const testRoute = async (req: Request, res: any) => {
  const params = {
    Bucket: bucket_name || "",
    Prefix: `${req.body.chain}-`,
  };

  const nfts = await NFT.find({
    contract: "0x458d37551bd25C025648717E9Ee128b9DEd4dC59",
  });
  console.log(nfts.length);

  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i] as any;

    if (nft?.metaData?.collectionName === "Drifters") {
      console.log("updating");
      await NFT.findByIdAndUpdate(nft._id, {
        metaData: {
          ...nft.metaData,
          collectionName: "Employees of the Metaverse",
        },
      });
    }

    // if (
    //  nft.metaData.image //&&
    // !nft.metaData.image.includes(
    // "nft-cache-images.s3.eu-west-1.amazonaws.com"
    //)
    //) {
    console.log("deleting ", nft.metaData?.image);
    // await NFT.findByIdAndDelete(nft._id);
    //}
  }

  /*s3.listObjects(params, (err, data) => {
    // var start = new Date();
    // start.setUTCHours(0, 0, 0, 0);
    if (data && data.Contents?.length) {
      for (let i = 0; i < data.Contents?.length; i++) {
        if (data.Contents[i].Key?.includes(req.body.collection)) {
          console.log(data.Contents[i].Key);

          s3.deleteObject(
            {
              Bucket: bucket_name || "",
              //@ts-ignore
              Key: data.Contents[i].Key!,
            },
            (err, data) => {
              console.log(`data: ${i} ` + data);
            }
          );
        }
      }
    }
  }); //"KINGSGUARD"

  const nfts = await NFT.find({
    chainId: req.body.chain,
  });

  Promise.all(
    nfts.map(async (nft) => {
      if (nft.tokenId.toString().includes(req.body.collection)) {
        console.log(nft);
        return NFT.findByIdAndDelete(nft._id);
      }
    })
  );

  /*const params = {
    Bucket: bucket_name || "",
    Key: req.body.key,
  };

  s3.deleteObject(
    {
      Bucket: bucket_name || "",
      Key: params.Key,
    },
    (err, data) => {
      console.log(data);
    }
  );*/

  res.end();
};
