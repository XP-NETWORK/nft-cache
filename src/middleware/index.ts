import { Request, Response, NextFunction } from 'express'
import { parsedNft } from '../models/interfaces/nft';

export const validateAdd = (req: Request, res: Response, next: NextFunction) => {
    const body: parsedNft = req.body

    const {
        chainId,
        tokenId,
        owner,
        uri,
        contract = "",
        contractType,
        metaData,
    } = body

    if (!chainId || !tokenId || !metaData) {
        console.log("chainId/tokenId/metaData is missing");
        return res.send("chainId/tokenId/metaData is missing");
    }

    if (!metaData.image && !metaData.animation_url) {
        console.log("image/vid missing");
        return res.send("image/video uri is missing for params");
    }

    next()
}


export const prepareObject = (req: Request, res: Response, next: NextFunction) => {
    const body: parsedNft = req.body

    const { metaData, chainId, contract, tokenId } = body

    const nftObj = {
        ...req.body,
        uri: metaData.animation_url && !metaData.image ? metaData.animation_url : metaData.image
    }

    res.locals.nftObj = nftObj

    next()
}