/*import { Request, Response, NextFunction } from "express";
import { parsedNft } from "../models/interfaces/nft";

import { nftGeneralParser } from "nft-parser/dist/src/index";
import { uploader } from "../services/uploader";

let decoder = new TextDecoder();

export const parseNft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { nft, account, whitelisted } = req.body;

  /*if (/^custom_encoded64\:/.test(nft.uri)) {
    const decoded = decoder.decode(
      new Uint8Array(
        nft.uri
          .replace("custom_encoded64:", "")
          .split(",")
          .map((s: any) => Number(s))
      )
    );

    nft.uri = decoded;
    nft.native.uri = decoded;
  }

  if (!nft?.native?.chainId || !nft?.collectionIdent || !nft?.native?.tokenId) {
    return res.send("key parameter missing");
  }

  const fileKey: string = `${nft.native.chainId}-${nft.collectionIdent}-${nft.native.tokenId}`;
  try {
    const idx = uploader.pool.findIndex((item) => item.key === fileKey);

    if (idx > -1) {
      console.log("already in pool");
      const response = uploader.pool[idx].data;

      return res.send(
        response
          ? {
              ...response,
              uri:
                response.metaData?.animation_url && !response.metaData.image
                  ? response.metaData?.animation_url
                  : response.metaData.image,
            }
          : "That nft is already caching"
      );
    }

    const itemIdx =
      uploader.pool.push({
        key: fileKey,
        data: undefined,
      }) - 1;

    setTimeout(() => uploader.release(fileKey), 30000);

    const parsed = await nftGeneralParser(nft, account, whitelisted).catch(
      (e) => {
        console.log(e.code);
        throw e;
      }
    );

    if (uploader.pool[itemIdx])
      uploader.pool[itemIdx] = {
        key: uploader.pool[itemIdx].key,
        data: parsed,
      };

    if (parsed?.metaData?.image || parsed?.metaData?.animation_url) {
      res.locals.parsed = parsed;
      next();
    } else {
      uploader.release(fileKey);
      res.json(parsed);
    }
  } catch (e: any) {
    console.log(e, "error in parser");
    uploader.release(fileKey);
    res.end();
  }
};

/*export const validateAdd = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body: parsedNft = res.locals.parsed;
  if (!body) return res.end();

  const {
    chainId,
    tokenId,
    metaData,
  } = body;

  if (!chainId || !tokenId || !metaData) {
    console.log("chainId/tokenId/metaData is missing");
    return res.send("chainId/tokenId/metaData is missing");
  }

  if (!metaData.image && !metaData.animation_url) {
    console.log("image/vid missing");
    return res.send("image/video uri is missing for params");
  }

  next();
}

export const prepareObject = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body: parsedNft = res.locals.parsed;

  const { metaData } = body;

  const nftObj = {
    ...body,
    uri:
      metaData?.animation_url && !metaData.image
        ? metaData?.animation_url
        : metaData.image,
  };

  res.locals.nftObj = nftObj;

  next();
};
*/
