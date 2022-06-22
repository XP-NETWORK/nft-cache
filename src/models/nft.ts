import { model, Schema } from "mongoose";
// import { CustomDocumentBuild } from '../../utils/mongodb/documentDefaults'
import { CustomDocumentBuild } from "../mongodb/documentDefaults";
import { INFTDocument, INFTModel, INFT } from "./interfaces/nft";
import {
  sendNewNFTCachedMessage,
  sendNFTexistsMessage,
} from "../helpers/telegram";

export const docNFT = {
  chainId: { type: String },
  tokenId: { type: String },
  owner: { type: String },
  uri: { type: String },
  contract: { type: String },
  contractType: { type: String },
  collectionIdent: { type: String },
  metaData: { type: Schema.Types.Mixed },
  misc: { type: Schema.Types.Mixed },
};

export const schema = CustomDocumentBuild(docNFT);
schema.index({ uri: 1 });
/**
 * MODEL NFT, used for interactions with MongoDB
 */

schema.statics.getByURI = async function (uri: string) {
  // return await this.findOne({ "metaData.image": uri })
  // return await query.exec().then((r: INFTDocument) => r ? r : undefined)
  return await this.findOne({ uri: uri }).exec();
};

schema.statics.getByData = async function (
  contract: string,
  chainId: string,
  tokenId: string
) {
  return await this.findOne({
    contract: contract,
    chainId: chainId,
    tokenId: tokenId,
  });
  //return await query.exec().then((r: INFTDocument) => r ? r : undefined)
};

schema.statics.addToCache = async function (obj: any, mediasAdded: number) {
  try {
    let NFT = await this.findOne({
      contract: obj.contract,
      tokenId: obj.tokenId,
    });
    if (NFT !== null) {
      //sendNFTexistsMessage(NFT._id)
      //res.send(NFT.metaData)
      return;
    } else {
      //res.send(obj)
      new Promise((reslove, rejects) => {
        try {
          reslove(this.create(obj));
        } catch {
          rejects("error");
        }
      });
    }

    //FIX THAT MESSAGE VVVVV

    //sendNewNFTCachedMessage(obj.chainId, obj.tokenId, obj.contract, obj.metaData.media, obj.metaData.format)
    return;
  } catch (error) {
    // res.send(error)
  }
};

schema.statics.addToCacheFile = async function (obj: any, res: any) {
  let NFT = await this.findOne({ uri: obj.uri });
  if (NFT !== null) {
    //sendNFTexistsMessage(NFT._id)
    res.send(obj.metaData);
    return;
  } else {
    res.send(obj.metaData);
    new Promise((reslove, rejects) => {
      try {
        reslove(this.create(obj.metaData));
      } catch {
        rejects("error");
      }
    });
  }
};

const NFT: INFTModel = model<INFTDocument, INFTModel>("nfts", schema);
export default NFT;
export { INFT, INFTModel };
