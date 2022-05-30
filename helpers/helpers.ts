import { bucket_name, ACL } from './consts'

export const dataToParams = (chainId: string, tokenId: string, contract: string, mediaURI: string, format: string) => {

    //let contentType = ""

    /*switch (format) {
        case "png":
            {
                contentType = "image/png"
                break;
            }
        case "jpg":
            {
                contentType = "image/jpg"
                break;
            }
        case "jpeg":
            {
                contentType = "image/jpeg"
                break;
            }
        case "gif":
            {
                contentType = "image/gif"
                break;
            }
        case "mp4":
            {
                contentType = "video/mp4"
                break;
            }
        case "avi":
            {
                contentType = "video/x-msvideo"
                break;
            }
        case "png":
            {
                contentType = "image/png"
                break;
            }
        case "mpeg":
            {
                contentType = "video/mpeg"
                break;
            }

    }*/


    const params = {
        Bucket: bucket_name,
        Key: `${chainId}-${contract}-${tokenId}`,
        Body: mediaURI,
        ACL: ACL,
        ContentType:  "*/*", //"video/mp4" //contentType
    }
    return params

}


export const dataToNFTObj = (chainId: string, tokenId: string, owner: string, name: string, symbol: string, contract: string, contractType: string, metaData: Object) => {
    const obj = {
        chainId: chainId,
        tokenId: tokenId,
        owner: owner,
        name: name,
        symbol: symbol,
        contract: contract,
        contractType: contractType,
        metaData: metaData
    }
    return obj
}