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

import { Request, Response } from "express";

//get the metadata back by the url (retrieving ONLY the metadata)
export const getByURI = async (req: Request, res: Response) => {
  const uri = req?.query?.uri as string;

  if (!uri) {
    res.status(401).send("no url given");
    return;
  }
  try {
    console.log(uri, "uri");
    const result: any = await NFT.getByURI(uri);
    if (result) {
      res.status(200).send(result.metaData);
      return;
    } else {
      res.status(200).send("no NFT with that data was found");
      return;
    }
  } catch (error) {
    res.status(400).send("problem in getByURI, error is: " + error);
    return;
  }
};
