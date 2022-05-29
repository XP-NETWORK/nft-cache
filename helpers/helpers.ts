import { bucket_name, ACL } from './consts'

export const dataToParams=(chainId:string,tokenId:string,contract:string,image:string)=>{
    const params={
        Bucket: bucket_name,
        Key: `${chainId}-${contract}-${tokenId}`,
        Body: image,
        ACL: ACL
    }
    return params
}


export const dataToNFTObj=(chainId:string, tokenId:string, owner:string, name:string, symbol:string, contract:string, contractType:string, metaData:Object)=>{
    const obj={
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