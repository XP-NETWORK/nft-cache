import NFT, { INFT } from './models/nft'
import mongoose from 'mongoose'
import { s3 } from "./s3/s3Client";
import fs from 'fs'
import axios from 'axios';
import { NFTtype } from './types/types'

export const test = (req: any, res: any) => {
    console.log("works")
    res.status(200).send("works!!!")
}

export const getByURI = async (req: any, res: any) => {
    const url = req.query.url

    if (!url) {
        res.status(401).send("no url given")
        return
    }
    try {
        const result = await NFT.find({ uri: url })
        if (result) {
            res.status(200).send(result)
            return
        }
        else {
            res.status(200).send("no such NFT found")
        }
    } catch (error) {
        res.status(400).send("problem in getNftViaUrl, error is: ", error)
    }
}


export const getByData = async (req: any, res: any) => {
    const { chainId, contract, tokenId } = req.query
    if (!chainId || !contract || !tokenId) {
        res.status(400).send("there was a problem with your request, you didn't send id/contract/token")
        return
    }
    console.log(chainId, tokenId, contract)
    try {
        const result: INFT = await NFT.getByData(contract, chainId, tokenId)

        if (result) {
            res.status(200).send(result.metaData)
            return
        }
        else {
            res.status(200).send("no NFT with that data was found")
            return
        }
    } catch (error) {
        res.status(400).send("problem with getNftFromToken, error is: ", error)
    }
}

export const addNFT = async (req: any, res: any) => {
    console.log("1. adding...")
    //console.log(req.body)
    const { chainId, tokenId, owner, smartContractAddress, name, symbol, contract, contractType, metaData } = req.body
    //creating parameters for uploading to S3 bucket
    const params = {
        Bucket: "nft-cache-images",
        Key: `${chainId}-${smartContractAddress}-${tokenId}`,
        Body: metaData.image,
        ACL: "public-read"
    };



    let obj = {
        chainId: chainId,
        tokenId: tokenId,
        owner: owner,
        name: name,
        symbol: symbol,
        contract: contract,
        contractType: contractType,
        metaData: {}
    }
    let newMD = metaData//new meta data
    await upload(params, res)
        .then(async (imageUri) => {
            
            console.log("5. imageUri: " + imageUri)
            console.log("6. image retrieved successfully")
            newMD.image = imageUri
            obj.metaData = newMD

            //uploading to mongoDB

            try {
                console.log("7. creating new NFT in mongoDB")
                const result = await NFT.create(obj)
                if (result) {
                    console.log("8. NFT record created")
                    res.status(200).send(result)
                    return
                }
            } catch (error) {
                res.status(400).send("couldn't add nft to the cache: " + error)
                return
            }

        })
        .catch((err) => {
            res.send("error in upload call in addNFT function is: " + err)
        })

}

const upload = async (params: any, res: any) => new Promise((resolve:any, reject:any) => {
    
    try {
        console.log("2. starting an upload to s3 bucket...")
        //upload to s3 photos bucket
        s3.upload(params, async (err: any, data: any) => {
            if (err) {
                console.log("error in s3.upload inside upload function inside addNFT function: " + err);
                res.send("error in s3.upload inside upload function inside addNFT function: " + err)
                return
            }
            console.log("3. upload done successfully, retrieving image...")
            //const paramsForImageRetrieval = { Bucket: "nft-cache-images", Key: data.key };
            //console.log("data asd: " + JSON.stringify(data))
    
            //sending the image's uri back to us
            /*await s3.getObject(paramsForImageRetrieval, function (err, data) {
                if(err)
                {
                    console.log("error in s3.getObject in upload function in addNFT function is: "+err.message)
                    res.send("error in s3.getObject in upload function in addNFT function is: "+err.message)
                    return
                }
                console.log("we got here: ",data)
                //res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                //res.write(data.Body, 'binary');
                //res.end(null, 'binary');
            });*/
            console.log("4. loc: " + data.Location)
            return data.Location
    
        })
    
    
    } catch (error) {
    
        res.status(404).send("general error in upload func is: " + error)
    }


})



export const show = (req: any, res: any) => {
    try {
        const testing = NFT.getByURI(req.query.uri)
            .then((data) => {
                res.status(200).send(data)
            })
    } catch (error) {
        res.status(400).send("error in show is: ", error)
    }
}









