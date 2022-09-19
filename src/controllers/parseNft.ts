import { Request, Response } from "express";
import { nftGeneralParser } from "nft-parser/dist/src";

export const parseNft = async (req: Request, res: Response) => {
  const { uri, native, collectionIdent } = req.body;

  if (!native?.chainId || !collectionIdent || !native?.tokenId || !uri) {
    return res.status(422).send("key parameter missing");
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

    if (parsed.errorStatus === 404) {
      return res.status(404).json(parsed);
    }

    res.status(200).json(parsed);
  } catch (e: any) {
    console.log(e, "e");
    res.status(422).send(e.message);
  }
};
