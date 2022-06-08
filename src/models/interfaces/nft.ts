import { Document, Model, Schema } from 'mongoose'

export interface INFT {
    chainId: { type: String },
    tokenId: { type: String },
    owner?: { type: String },
    uri: { type: String },
    contract: { type: String },
    contractType: { type: String },
    collectionIdent: { type: String },
    metaData: { type: Schema.Types.Mixed },
    misc?: { type: Schema.Types.Mixed }
}

// Instance methods
export interface INFTDocument extends INFT, Document {
    toJSON(): INFTDocument;
}


// Static methods
export interface INFTModel extends Model<INFTDocument> {
    getByURI(uri: string): Promise<INFTDocument>
    getByData(contract: string, chainId: string, tokenId: string): Promise<INFTDocument>
    addToCache(obj: any, res: any, mediasAdded: number): Promise<INFTDocument>
    addToCacheFile(obj: any, res: any): Promise<INFTDocument>
}
