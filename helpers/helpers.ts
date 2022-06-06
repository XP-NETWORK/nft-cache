import { bucket_name, ACL } from './consts'

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
            items:1
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
            items:2
        }
        return params
    }
}


export const dataToNFTObj = (chainId: string, tokenId: string, contract: string, metaData: Object, misc: any) => {
    const obj = {
        chainId: chainId,
        tokenId: tokenId,
        contract: contract,
        metaData: metaData,
        misc: misc
    }
    return obj
}

