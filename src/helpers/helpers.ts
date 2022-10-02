import { bucket_name, ACL } from "./consts";
import { uuid } from "uuidv4";
import { parsedNft } from "../models/interfaces/nft";

export const dataToParams = (
  chainId: string,
  tokenId: string,
  contract: string,
  imageNvideo: any
) => {
  if (imageNvideo.twoItems === 0) {
    const params = {
      params: {
        Bucket: bucket_name,
        Key: `${chainId}-${contract}-${tokenId}`,
        Body: imageNvideo.item,
        ACL: ACL,
        ContentType: "*/*",
      },
      items: 1,
    };
    return params;
  }

  if (imageNvideo.twoItems === 1) {
    const params = {
      imageParams: {
        Bucket: bucket_name,
        Key: `${chainId}-${contract}-${tokenId}-image`,
        Body: imageNvideo.image,
        ACL: ACL,
        ContentType: "*/*",
      },
      videoParams: {
        Bucket: bucket_name,
        Key: `${chainId}-${contract}-${tokenId}-video`,
        Body: imageNvideo.video,
        ACL: ACL,
        ContentType: "*/*",
      },
      items: 2,
    };
    return params;
  }
};

export const dataToNFTObj = (
  uri: any,
  chainId: any,
  tokenId: any,
  contract: any,
  metaData: any,
  misc: any
) => {
  const obj = {
    chainId: chainId,
    tokenId: tokenId,
    contract: contract,
    uri: uri,
    metaData: metaData,
    misc: misc,
  };
  return obj;
};

export const dataToNFTObjFile = (uri: any, metaData: any) => {
  const obj = {
    uri: uri,
    metaData: metaData,
  };
  return obj;
};

export function patchNft(
  nft: parsedNft & { native?: any },
  url: string,
  animUrl?: string
) {
  return {
    ...nft,
    ...(nft.native ? { native: nft.native } : {}),
    uri: nft.native?.uri || nft.uri,
    metaData: {
      ...nft.metaData,
      image: url,
      ...(animUrl ? { animation_url: animUrl } : {}),
    },
  };
}

export const paramsForFile = (uri: string) => {
  const uriArr = uri.split("/");
  console.log("the arr is: ", uriArr);

  const uriKey = uriArr[uriArr.length - 1];

  const params = {
    Bucket: bucket_name,
    Key: uriKey,
    Body: uri,
    ACL: ACL,
    ContentType: "*/*",
  };

  return params;
};

export const setupURI = (uri: string): string => {
  if (uri) {
    if (uri.includes("https://ipfs.io")) {
      return uri;
    } else if (/^ipfs:\/\//.test(uri)) {
      return "https://ipfs.io/ipfs/" + uri.split("://")[1];
    } else if (/^https\:\/\/ipfs.io/.test(uri)) {
      return uri;
    } else if (
      uri.includes("data:image/") ||
      uri.includes("data:application/")
    ) {
      return uri;
    } else if (uri[0] === "Q") {
      return `https://ipfs.io/ipfs/${uri}`;
    } else if (uri.includes("http://")) {
      return uri.replace("http://", "https://");
    } else if (/^https\:\/\//.test(uri)) {
      return uri;
    } else {
      throw new Error("unknown uri format");
    }
  } else {
    return uri;
  }
};
