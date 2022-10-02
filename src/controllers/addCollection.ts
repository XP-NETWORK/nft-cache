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

import { patchNft, setupURI } from "../helpers/helpers";

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
      contract: contract,
    }),
  ]);

  const cacheTokens = cahces
    .map((nft) => nft.tokenId)
    .sort((a, b) => +b! - +a!) as unknown[];

  let nfts: Idoc[] = [];
  console.log(rawNfts.length, "rawNfts");
  rawNfts.forEach((nft) => {
    if (nfts.findIndex((n) => n.tokenId === nft.tokenId) === -1) {
      nfts.push(nft);
    }
  });

  console.log(nfts.length);
  console.log(cacheTokens.length);

  //nfts = nfts.slice(0, 1);

  /*const lacking: Idoc[] = [];

  [...Array(2633).keys()].slice(1).forEach((num) => {
    const id = String(num);
    if (!cacheTokens.includes(id)) {
      //@ts-ignore
      const a = nfts.at(1)?._doc;
      lacking.push({
        ...a,
        tokenId: id,
        //contract: "0x36f8f51f65fe200311f709b797baf4e193dd0b0d",
        uri: `https://www.treatdao.com/api/nft/${id}`,
      });
    }
  });

  nfts = lacking;

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

  const pack = 500;
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
                console.log(key);
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

                  try {
                    const imageUrl = parsed?.metaData?.image;
                    const animUrl = parsed?.metaData?.animation_url;
                    /*const [imageUrl, animUrl] = await uploader.uploadAll(
                      key,
                      parsed
                    );*/

                    console.log(imageUrl, ":FINISH");

                    if (imageUrl || animUrl) {
                      await NFT.addToCache(
                        patchNft(parsed, String(imageUrl), String(animUrl)),
                        1
                      );

                      cacheTokens.push(nft.tokenId);
                    }
                  } catch (e) {
                    if (e === "file size limit is exceeded") {
                      console.log("finished exceeded ", nft.tokenId);
                      await NFT.addToCache(parsed, 1);
                      cacheTokens.push(nft.tokenId);
                      return;
                    }
                    throw e;
                  }
                }
              }
            } catch (e: any) {
              console.log(e.code || e, "upper");
            }
          })
        );
      }
    }

    console.log(nfts.length);
    console.log(cacheTokens.length, "cacheTokens");
    await uploader.delay(10000);
    loop();
  };

  loop();

  res.end();
};

export const uploadCollection = async (req: Request, res: any) => {
  if (req.body.pass !== pass) return res.end("403");

  const { contract, chainId } = req.body;

  let [ofOwner, nfts] = await Promise.all([
    indexer.find({
      chainId,
      contract,
      owner: "0xe4404312Df66A00f1Bee475455A46a558D97D2B2",
    }),
    NFT.find({
      chainId,
      contract: contract,
    }),
  ]);

  const tokensOfOwner = ofOwner.map((nft) => String(nft.tokenId));

  console.log(tokensOfOwner.length, "");

  const cacheTokens: string[] = [];

  const pack = 10000;
  const x = Math.ceil(nfts.length / pack);

  const loop = async () => {
    for (let i = 1; i <= x; i++) {
      if (true) {
        const start = (i - 1) * pack;
        const end = i * pack > nfts.length ? nfts.length : i * pack;

        const chunk = nfts.slice(start, end);

        await Promise.all(
          chunk.map(async (nft) => {
            if (
              nft.uri &&
              nft.tokenId &&
              tokensOfOwner.includes(String(nft.tokenId)) &&
              !cacheTokens.includes(String(nft.tokenId)) &&
              //@ts-ignore
              !/cache-images.s3.eu/.test(nft?.metaData?.image)
            ) {
              const parsed = {
                ...nft.toObject(),
              } as parsedNft;

              const key = `${chainId}-${contract}-${nft.tokenId}`;

              try {
                uploader.setLimit(15000000);
                const [imageUrl, animUrl] = await uploader.uploadAll(
                  key,
                  parsed
                );

                console.log(imageUrl, ":FINISH");

                if (imageUrl || animUrl) {
                  console.log("saving...");
                  await NFT.updateOne(
                    { _id: nft._id },
                    {
                      "metaData.image": imageUrl,
                      "metaData.animation_url": "",
                    }
                  );

                  cacheTokens.push(String(nft.tokenId));
                }
              } catch (e: any) {
                console.log(e.code || e);
                //throw e;
              }
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

//https://api.tzkt.io/v1/tokens/balances?account=tz1WS92CzY5LdJGZU36sCZrDPtejZNMvHXfu&token.standard=fa2&limit=10000
export const uploadTezos = async (req: Request, res: any) => {
  if (req.body.pass !== pass) return res.end("403");

  const { contract, chainId, owner } = req.body;

  let [caches] = await Promise.all([
    NFT.find({
      chainId,
      collectionIdent: contract,
    }),
  ]);

  let nfts: any[] = await (
    await axios(
      `https://api.tzkt.io/v1/tokens/balances?account=${owner}&token.standard=fa2&limit=10000`
    )
  ).data;

  nfts = nfts.filter((nft) => nft.token.contract.address === contract);

  const cachedTokens: string[] = caches.map((c) => String(c.tokenId));

  const pack = 20;
  const x = Math.ceil(nfts.length / pack);

  const loop = async () => {
    for (let i = 1; i <= x; i++) {
      if (true) {
        const start = (i - 1) * pack;
        const end = i * pack > nfts.length ? nfts.length : i * pack;

        const chunk = nfts.slice(start, end);

        await Promise.all(
          chunk.map(async (nft) => {
            nft = nft.token;
            const tokenId = nft.tokenId;
            try {
              if (nft.metadata && !cachedTokens.includes(String(tokenId))) {
                const key = `${chainId}-${contract}-${nft.tokenId}`;

                const parsed = {
                  chainId,
                  tokenId,
                  uri: setupURI(nft.metadata.displayUri),
                  contract,
                  collectionIdent: contract,
                  metaData: {
                    image: setupURI(nft.metadata.displayUri),
                    imageFormat: "png",
                    attributes: nft.metadata.attributes,
                    description: nft.metadata.description,
                    name: nft.metadata.name,
                    symbol: nft.metadata.symbol,
                  },
                };

                if (parsed.metaData) {
                  if (!pool.checkItem(key)) {
                    pool.addItem({
                      key,
                      data: parsed,
                    });
                  }

                  try {
                    const [imageUrl, animUrl] = await uploader.uploadAll(
                      key,
                      parsed
                    );

                    console.log(imageUrl, ":FINISH");

                    if (imageUrl || animUrl) {
                      await NFT.addToCache(
                        patchNft(parsed, String(imageUrl), String(animUrl)),
                        1
                      );

                      cachedTokens.push(tokenId);
                    }
                  } catch (e) {
                    if (e === "file size limit is exceeded") {
                      console.log("finished exceeded ", tokenId);
                      await NFT.addToCache(parsed, 1);
                      cachedTokens.push(tokenId);
                      return;
                    }
                    throw e;
                  }
                }
              }
            } catch (e: any) {
              console.log(e.code || e, "upper");
            }
          })
        );
      }
    }

    console.log(nfts.length);
    console.log(cachedTokens.length, "cacheTokens");
    await uploader.delay(10000);
    loop();
  };

  loop();

  res.end();
};
