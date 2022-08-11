import { Document, Model, Schema } from "mongoose";

export interface parsedNft {
  chainId: string;
  tokenId: string;
  owner?: string;
  uri: string;
  contract?: string;
  contractType?: string;
  collectionIdent?: string;
  forceCache?: boolean;
  metaData: {
    image: string;
    imageFormat: string;
    animation_url?: string;
    animation_url_format?: string;
    name?: string;
    symbol?: string;
    attributes?: any;
    description?: string;
    contractType?: string;
    collectionName?: string;
  };
}

export interface INFT {
  chainId: { type: String };
  tokenId: { type: String };
  owner?: { type: String };
  uri: { type: String };
  contract: { type: String };
  contractType: { type: String };
  collectionIdent: { type: String };
  metaData: { type: Schema.Types.Mixed };
  misc?: { type: Schema.Types.Mixed };
}

// Instance methods
export interface INFTDocument extends INFT, Document {
  toJSON(): INFTDocument;
}

// Static methods
export interface INFTModel extends Model<INFTDocument> {
  getByURI(uri: string): Promise<INFTDocument>;
  getByData(
    contract: string,
    chainId: string,
    tokenId: string
  ): Promise<INFTDocument>;
  addToCache(obj: any, mediasAdded: number): Promise<INFTDocument>;
  addToCacheFile(obj: any, res: any): Promise<INFTDocument>;
}
