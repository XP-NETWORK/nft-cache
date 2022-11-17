import { Request, Response } from "express";

import NFT from "../models/nft";

import { bucket_name } from "../helpers/consts";

import { s3 } from "../services/s3Client";

export const deleneNFt = async (req: Request, res: Response) => {
  const { chainId, collectionIdent, pass } = req.body;
  if (req.body.pass !== pass) return res.end("403");

  const nfts = await NFT.find({
    chainId,
    ...(collectionIdent ? { contract: collectionIdent } : {}),
  });

  for (const nft of nfts) {
    //@ts-ignore
    const image = nft.metaData.image!;

    if (image.includes("nft-cache-images.s3.eu-west-1.amazonaws.com")) {
      const key = image.replace(
        "https://nft-cache-images.s3.eu-west-1.amazonaws.com/",
        ""
      );

      console.log("");

      const params = {
        Bucket: bucket_name || "",
        Key: key,
      };

      s3.deleteObject(params, (err, data) => {
        console.log(err, "err");
        console.log(key, "success");
      });
    }

    await nft.delete();
  }

  res.end();
};
