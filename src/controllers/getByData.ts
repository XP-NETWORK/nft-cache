import NFT, { INFT } from "../models/nft";
import { Request, Response } from "express";

export const getByData = async (req: Request, res: Response) => {
  let { chainId, contract = "", tokenId } = req.query;

  if (!chainId /*|| !contract*/ || !tokenId) {
    res
      .status(400)
      .send(
        "there was a problem with your request, you didn't send id/contract/token"
      );
    return;
  }

  //if (String(chainId) === "2") {
  //contract = "";
  //}

  try {
    const result: INFT = await NFT.getByData(
      contract as string,
      chainId as string,
      tokenId as string
    );

    if (result) {
      res.status(200).send(result.metaData);
      return;
    } else {
      res.status(200).send("no NFT with that data was found");
      return;
    }
  } catch (error: any) {
    console.log(error);
    res.status(400).send("problem with getNftFromToken, error is: ");
  }
};
