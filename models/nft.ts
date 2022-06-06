import { model, Schema } from 'mongoose'
import { CustomDocumentBuild } from '../utils/mongodb/documentDefaults'
import { INFTDocument, INFTModel, INFT } from '../interfaces/nft'
import { sendNewNFTCachedMessage, sendNFTexistsMessage } from '../helpers/telegram'

export const docNFT = {
    chainId: { type: String },
    tokenId: { type: String },
    owner: { type: String },
    uri: { type: String },
    contract: { type: String },
    contractType: { type: String },
    collectionIdent: { type: String },
    metaData: { type: Schema.Types.Mixed },
    misc: { type: Schema.Types.Mixed }
}

export const schema = CustomDocumentBuild(docNFT)
schema.index({ uri: 1 }, { unique: true })
/**
 * MODEL NFT, used for interactions with MongoDB
 */

schema.statics.getByURI = async function (
    uri: string
) {
    return await this.findOne({ "metaData.image": uri })
    //return await query.exec().then((r: INFTDocument) => r ? r : undefined)
}

schema.statics.getByData = async function (contract: string, chainId: string, tokenId: string) {
    return await this.findOne({ contract: contract, chainId: chainId, tokenId: tokenId })
    //return await query.exec().then((r: INFTDocument) => r ? r : undefined)
}


schema.statics.addToCache = async function (obj: any, res: any, mediasAdded: number) {
    let NFT = await this.findOne({ contract: obj.contract, tokenId: obj.tokenId })
    if (NFT) {
        sendNFTexistsMessage(NFT._id)
        res.send(`such NFT already exists in cache with id: ${NFT._id}`)
        return
    }

    
        res.send(obj)
        NFT = await this.create(obj)

        console.log("7. NFT record created")


    //FIX THAT MESSAGE VVVVV

    //sendNewNFTCachedMessage(obj.chainId, obj.tokenId, obj.contract, obj.metaData.media, obj.metaData.format)
    return


}

const NFT: INFTModel = model<INFTDocument, INFTModel>('nfts', schema)
export default NFT
export {
    INFT,
    INFTDocument,
}