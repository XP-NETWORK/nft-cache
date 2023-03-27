import { nftGeneralParser, injectMoralis } from "nft-parser/dist/src/index";
import { parsedNft } from "../models/interfaces/nft";
import Moralis from "moralis";
import { config } from "dotenv";

config();

class Parser {
  constructor() {
    Moralis.start({
      apiKey: process.env.MORALIS_KEY!,
    });
    injectMoralis(Moralis);
  }

  prepareNft(nft: parsedNft) {
    const { metaData } = nft;

    return {
      ...nft,
      uri:
        metaData?.animation_url && !metaData.image
          ? metaData?.animation_url
          : metaData.image,
    };
  }

  async parseNft(nft: any, account: string, whitelisted: any) {
    const parsed = await nftGeneralParser(nft, account, whitelisted).catch(
      (e) => {
        throw e;
      }
    );

    return this.prepareNft(parsed);
  }
}

export default () => new Parser();
