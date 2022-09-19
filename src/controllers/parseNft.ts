import { Request, Response } from "express";
import { nftGeneralParser } from "nft-parser/dist/src";

export const parseNft = async (req: Request, res: Response) => {
  const { uri, native, collectionIdent } = req.body;

  if (!native?.chainId || !collectionIdent || !native?.tokenId || !uri) {
    return res.send("key parameter missing");
  }

  try {
    const parsed = await nftGeneralParser(
      {
        native,
        uri,
        collectionIdent,
      },
      "owner",
      true
    );

    res.status(200).json(parsed);
  } catch (e: any) {
    res.status(500).end();
  }
};
