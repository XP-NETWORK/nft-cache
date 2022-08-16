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

import { pass, indexer_db } from "../helpers/consts";

import { mongo_options } from "..";

import mongoose from "mongoose";

import Indexer, { Idoc } from "../services/indexUpdater";

import Pool from "../services/pool";

import { nftGeneralParser } from "nft-parser/dist/src";

const indexer = Indexer();
const uploader = Uploader();
const pool = Pool();

export const testRoute = async (req: Request, res: any) => {
  if (req.body.pass !== pass) return res.end("403");

  const { contract, chainId } = req.body;

  let [rawNfts, cahces] = await Promise.all([
    indexer.find({
      chainId,
      contract,
    }),
    NFT.find({
      chainId,
      collectionIdent: contract,
    }),
  ]);

  const cacheTokens = cahces
    .map((nft) => nft.tokenId)
    .sort((a, b) => +b! - +a!) as unknown[];

  const nfts: Idoc[] = [];
  console.log(rawNfts.length, "rawNfts");
  rawNfts.forEach((nft) => {
    if (nfts.findIndex((n) => n.tokenId === nft.tokenId) === -1) {
      nfts.push(nft);
    }
  });

  //nfts = nfts.slice(2, 3);

  /*const lacking: Idoc[] = [];

  [...Array(2001).keys()].slice(1).forEach((num) => {
    if (!cacheTokens.includes(String(num))) {
      //@ts-ignore
      const a = nfts.at(1)?._doc;
      lacking.push({
        ...a,
        tokenId: String(num),
        uri: `ipfs://QmUQaEJxaDoCTfRDsPMcBvvmpza7G8zgkrzxbSwUFuA3qA/${String(
          num
        )}.json`,
      });
    }
  });

  console.log(lacking.length);

  /*const obj: any = {};

  for (let i = 0; i < cacheTokens.length; i++) {
    const token = cacheTokens[i] as string;

    obj[token] = obj[token] ? obj[token] + 1 : 1;
  }

  /*console.log(obj["1324"]);

  Promise.all([
    Object.keys(obj).map(async (token) => {
      if (obj[token] > 1) {
        console.log("deliting ", token);
        return NFT.findOneAndRemove({
          collectionIdent: "0x4E9eB6f6e04464eEe33Ae04Bf430E20529482e60",
          chainId: "25",
          tokenId: token,
        });
      }
    }),
  ]);*/

  const pack = 5;
  const x = Math.ceil(nfts.length / pack);

  const loop = async () => {
    for (let i = 1; i <= x; i++) {
      if (true) {
        const start = (i - 1) * pack;
        const end = i * pack > nfts.length ? nfts.length : i * pack;

        const chunk = nfts.slice(start, end);
        await Promise.all(
          chunk.map(async (nft) => {
            try {
              if (
                nft.uri &&
                nft.tokenId &&
                !cacheTokens.includes(nft?.tokenId)
              ) {
                const key = `${chainId}-${contract}-${nft.tokenId}`;

                const parsed = pool.checkItem(key)
                  ? pool.get(pool.getItemIndex(key)).data
                  : await nftGeneralParser(
                      {
                        //@ts-ignore
                        native: nft,
                        uri: nft.uri,
                        collectionIdent: contract,
                      },
                      nft.owner,
                      true
                    );

                if (parsed.metaData) {
                  if (!pool.checkItem(key)) {
                    pool.addItem({
                      key,
                      data: parsed,
                    });
                  }

                  const [imageUrl, animUrl] = await uploader.uploadAll(
                    key,
                    parsed
                  );

                  console.log(imageUrl, ":FINISH");

                  if (imageUrl || animUrl) {
                    await NFT.addToCache(
                      NFT.patchNft(parsed, String(imageUrl), String(animUrl)),
                      1
                    );
                    cacheTokens.push(nft.tokenId);
                  }
                }
              }
            } catch (e: any) {
              console.log(e.code || e);
            }
          })
        );
      }
    }

    console.log(nfts.length);
    console.log(cacheTokens.length, "cacheTokens");
    await uploader.delay(5000);
    loop();
  };

  loop();

  res.end();
};

/**
 * 
 * 
 *  const params = {
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
