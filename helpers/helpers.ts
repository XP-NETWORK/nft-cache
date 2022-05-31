import { bucket_name, ACL } from './consts'

export const dataToParams = (chainId: string, tokenId: string, contract: string, mediaURI: string, format: string) => {

    const params = {
        Bucket: bucket_name,
        Key: `${chainId}-${contract}-${tokenId}`,
        Body: mediaURI,
        ACL: ACL,
        ContentType: "*/*", 
    }
    return params

}


export const dataToNFTObj = (chainId: string, tokenId: string, contract: string, metaData: Object,misc:any) => {
    const obj = {
        chainId: chainId,
        tokenId: tokenId,
        contract: contract,
        metaData: metaData,
        misc:misc
    }
    return obj
}

