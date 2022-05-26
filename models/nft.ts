import { Document, model, Schema } from 'mongoose'
import { ObjectId } from 'mongodb'
import { CustomDocumentBuild } from '../utils/mongodb/documentDefaults'
import { INFTDocument, INFTModel,INFT } from '../interfaces/nft'

export const docNFT = {
    chainId:{type:String},
    tokenId:{type:String},
    owner:{type:String},
    name:{type:String},
    symbol:{type:String},
    contract:{type:String},
    contractType:{type:String},
    metaData:{type:Schema.Types.Mixed}
}

export const schema = CustomDocumentBuild(docNFT)
schema.index({uri: 1}, {unique: true})
/**
 * MODEL NFT, used for interactions with MongoDB
 */

schema.statics.getByURI = async function(
    uri: string
) {
    const query = this.findOne({uri:uri})
    return await query.exec().then((r: INFTDocument) => r ? r : undefined)
}

schema.statics.getByData = async function(contract: string, chainId: string, tokenId: string)
{
    const query = this.findOne({contract: contract, chainId: chainId, tokenId: tokenId})
    return await query.exec().then((r: INFTDocument) => r ? r : undefined)
}

const NFT: INFTModel = model<INFTDocument, INFTModel>('nfts', schema)
export default NFT
export {
    INFT,
    INFTDocument,
}