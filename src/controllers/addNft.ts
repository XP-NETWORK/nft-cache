import NFT, { INFT } from "../models/nft";
import { patchNft } from "../helpers/helpers";
import { Request, Response } from "express";

import Uploader from "../services/uploader";
import Parser from "../services/parser";
import Pool from "../services/pool";

const pool = Pool();
const parser = Parser();
const uploader = Uploader();

export const addNft = async (req: Request, res: Response) => {
  const { nft, account, whitelisted } = req.body;
  const { collectionIdent } = nft
  const { chainId, tokenId, uri } = nft?.native

  if (!chainId || !collectionIdent || (chainId !== "27" && !tokenId) || (chainId === "27" && !uri)) {
    return res.send("key parameter missing");
  }

  const key = `${chainId}-${collectionIdent}-${chainId !== "27" ? tokenId : uri}`;

  if (pool.checkItem(key)) {
    console.log("already in pool");

    const { data } = pool.get(pool.getItemIndex(key));
    if (data) {
      return res.json(data);
    }
    return res.send("That nft is already caching");
  }

  pool.addItem({
    key,
  });

  try {
    const parsed = nft.metaData
      ? nft
      : await parser.parseNft(nft, account, whitelisted);

    pool.updateItem(key, parsed);

    res.json(parsed);

    await uploader.delay(4000);

    try {
      const [imageUrl, animUrl] = await uploader.uploadAll(key, parsed);

      const nft = patchNft(parsed, String(imageUrl), String(animUrl));

      (imageUrl || animUrl) &&
        (await NFT.addToCache(nft, 1).catch((e) => console.log(e)));

      console.log(`finishing caching ${imageUrl}|${animUrl}`);
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
