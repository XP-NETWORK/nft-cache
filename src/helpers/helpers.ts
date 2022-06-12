import { bucket_name, ACL } from './consts'
import { uuid } from 'uuidv4';

export const dataToParams = (chainId: string, tokenId: string, contract: string, imageNvideo: any) => {

    if (imageNvideo.twoItems === 0) {

        const params = {
            params: {
                Bucket: bucket_name,
                Key: `${chainId}-${contract}-${tokenId}`,
                Body: imageNvideo.item,
                ACL: ACL,
                ContentType: "*/*",
            },
            items: 1
        }
        return params
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
            items: 2
        }
        return params
    }
}


export const dataToNFTObj = (uri:any,chainId: any, tokenId: any, contract: any, metaData: any, misc: any) => {
    const obj = {
        chainId: chainId,
        tokenId: tokenId,
        contract: contract,
        uri:uri,
        metaData: metaData,
        misc: misc
    }
    return obj
}

export const dataToNFTObjFile = (uri: any, metaData: any) => {
    const obj = {
        uri:uri,
        metaData: metaData
    }
    return obj
}


export const paramsForFile = (uri: string) => {

    const uriArr = uri.split("/")
    console.log("the arr is: ",uriArr);
    
    const uriKey = uriArr[uriArr.length-1]

    const params = {
        Bucket: bucket_name,
        Key: uriKey,
        Body: uri,
        ACL: ACL,
        ContentType: "*/*",
    }

    return params
}