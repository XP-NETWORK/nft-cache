import mongoose, { ObjectId } from "mongoose";

import { indexer_db } from "../helpers/consts";

import { mongo_options } from "..";

const instance = new mongoose.Mongoose();

instance.connect(indexer_db!, mongo_options);

export interface Idoc {
  chainId?: string;
  tokenId?: string;
  owner?: string;
  contract?: string;
  uri?: string;
  name?: string;
  contractType?: string;
  symbol?: string;
}

interface INFTdoc {
  tokenId: string;
  owner: string;
  chainId: string;
  uri: string;
  name: string;
  symbol: string;
  contractType: string;
  contract: string;
}

const schema = new mongoose.Schema({
  chainId: "string",
  tokenId: "string",
  owner: "string",
  contract: "string",
  uri: "string",
  name: "string",
  contractType: "string",
  symbol: "string",
});

const IndexDoc = instance.model("eth-nft-dto", schema, "eth-nft-dto");

class IndexUpdater {
  constructor() {}

  async find(query: Idoc): Promise<Idoc[]> {
    return IndexDoc.find(query)
      .then((docs: Idoc[]) => docs)
      .catch((e) => {
        console.log(e);
        return [];
      });
  }

  async findOne(query: Idoc): Promise<Idoc | null> {
    return IndexDoc.findOne(query)
      .then((doc: Idoc) => doc)
      .catch((e) => {
        console.log(e);
        return null;
      });
  }

  async remove(id: ObjectId): Promise<null> {
    return IndexDoc.findByIdAndDelete(id)
      .then((doc: Idoc) => null)
      .catch((e) => {
        console.log(e);
        return null;
      });
  }

  async create(doc: INFTdoc): Promise<void> {
    await new IndexDoc({
      name: doc.name,
      symbol: doc.symbol,
      tokenId: doc.tokenId,
      owner: doc.owner,
      chainId: doc.chainId || "20",
      contractType: "ERC721",
      uri: doc.uri,
      contract: doc.contract,
    })
      .save()
      .catch((e: any) => console.log(e, "on ceation"));
  }

  async createMany(docs: INFTdoc[]): Promise<void> {
    await IndexDoc.insertMany(
      docs.map((doc) => ({
        ...doc,
        name: doc.name,
        symbol: doc.symbol,
        contractType: "ERC721", //?????
        contract: doc.contract,
      }))
    ).catch((e) => console.log(e, "on creating bunch"));
  }
}

export default () => new IndexUpdater();
export type { IndexUpdater };
