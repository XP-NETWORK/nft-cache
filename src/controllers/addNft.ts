import NFT, { INFT } from "../models/nft";
//import e from 'connect-timeout';

import { Request, Response } from "express";

import Uploader from "../services/uploader";
import Parser from "../services/parser";
import Pool from "../services/pool";

const pool = Pool();
const parser = Parser();
const uploader = Uploader();

export const addNft = async (req: Request, res: Response) => {
  const { nft, account, whitelisted } = req.body;

  if (!nft?.native?.chainId || !nft?.collectionIdent || !nft?.native?.tokenId) {
    return res.send("key parameter missing");
  }

  const key = `${nft.native.chainId}-${nft.collectionIdent}-${nft.native.tokenId}`;

  if (pool.checkItem(key)) {
    console.log("already in pool");

    const { data } = pool.get(pool.getItemIndex(key));
    if (data) {
      return res.json(data);
    }
    return res.send("That nft is already caching");
  }

  pool.addItem({
    key: `${nft.native.chainId}-${nft.collectionIdent}-${nft.native.tokenId}`,
  });

  try {
    const parsed = await parser.parseNft(nft, account, whitelisted);

    pool.updateItem(key, parsed);

    res.json(parsed);

    await uploader.delay(4000);

    try {
      const [imageUrl, animUrl] = await uploader.uploadAll(key, parsed);

      console.log(imageUrl, animUrl);

      (imageUrl || animUrl) &&
        (await NFT.addToCache(
          NFT.patchNft(parsed, String(imageUrl), String(animUrl)),
          1
        ));

      console.log(`finishing caching ${key}`);
    } catch (e: any) {
      console.log(
        e.message || e,
        `error in uploader ${parsed?.metaData?.image}`
      );
      if (e === "file size limit is exceeded") {
        await NFT.addToCache(parsed, 1);
      }
    }
  } catch (e: any) {
    console.log(e.code, "error in parser");
  }

  pool.releaseItem(key);
  res.end();
};
