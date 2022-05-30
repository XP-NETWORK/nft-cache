import NFT, { INFT, INFTDocument } from './models/nft'
import { s3 } from "./s3/s3Client";
import { bucket_name, ACL } from './helpers/consts'
import { dataToNFTObj, dataToParams } from './helpers/helpers';
import axios from 'axios';
import multer from 'multer'
import multerS3 from 'multer-s3'
import fs from 'fs'

//to test the connection
export const test = (req: any, res: any) => {
    console.log("works")
    res.status(200).send("works!!!")
}

//get the metadata back by the url (retrieving ONLY the metadata)
export const getByURI = async (req: any, res: any) => {
    const uri = req.query?.uri

    if (!uri) {
        res.status(401).send("no url given")
        return
    }
    try {
        const result: INFTDocument = await NFT.getByURI(uri)
        if (result) {
            res.status(200).send(result.metaData)
            return
        }
        else {
            res.status(200).send("no such NFT found")
            return
        }
    } catch (error) {
        res.status(400).send("problem in getByURI, error is: " + error)
        return
    }
}

//getting the metadata by chain id, smart contract adderss and token id (retrieves ONLY the metadata)
//ALL THREE ARE REQUIRED
export const getByData = async (req: any, res: any) => {
    const { chainId, contract, tokenId } = req.query
    if (!chainId || !contract || !tokenId) {
        res.status(400).send("there was a problem with your request, you didn't send id/contract/token")
        return
    }
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
    const { chainId, tokenId, owner, name, symbol, contract, contractType, metaData } = req.body
    if (!chainId || !tokenId || !owner || !name || !symbol || !contract || !contractType || !metaData) {
        console.log("chainId/tokenId/owner/name/symbol/contract/contractType/metadata is missing")
        res.send("chainId/tokenId/owner/name/symbol/contract/contractType/metadata is missing")
        return
    }
    //creating parameters for uploading to S3 bucket
    if (!(metaData.media)) {
        console.log("image uri is missing for params")
        res.send("image uri is missing for params")
        return
    }

    console.log("checking request type: https or ipfs");

    const formattedMediaURI: any = checker(metaData.media)

    if (formattedMediaURI < 0) {
        console.log("error is: " + formattedMediaURI.item)
        res.send("error is: " + formattedMediaURI.item)
        return
    }

    if(!(metaData.format)){
        console.log("no format was sent in metadata, please add the format and send again")
        res.send("no format was sent in metadata, please add the format and send again")
        return
    }
    const params = dataToParams(chainId, tokenId, contract, formattedMediaURI,metaData.format)

    let obj = dataToNFTObj(chainId, tokenId, owner, name, symbol, contract, contractType, metaData)


    let newMetaData = metaData//new meta data
    await upload(params, res)
        .then(async (mediaUri) => {
            if (!mediaUri || mediaUri == -1) {
                res.send("no image uri received back")
                return
            }
            console.log("5. image retrieved successfully")
            newMetaData.media = mediaUri
            obj.metaData = newMetaData

            //uploading to mongoDB
            try {
                console.log("6. creating new NFT in mongoDB")
                const result: any = await NFT.addToCache(obj)
                //if the NFT already exists in the cache it will "result" will be the id of that NFT
                //if it doesn't exist, "result" will be the newly created NFT 
                if (result.exists == 1) {
                    console.log(`such NFT already exists in cache with id: ${result.id}`);
                    res.status(200).send(`such NFT already exists in cache with id: ${result.id}`)
                    return
                }
                if (result.exists == 0) {
                    console.log("7. NFT record created")
                    res.status(200).send(result.nft)
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

//inner function to upload an image to AWS s3 bucket and retrieve the image uri back
const upload = async (params: any, res: any) => {
    return new Promise((resolve: any, reject: any) => {

        try {
            if (!params || !res) {
                console.log("no params or res object were received in inner upload function ")
                return -1
            }
            console.log("3. starting an upload to s3 bucket...")
            console.log(params.Body.item)
            //upload to s3 photos bucket
        axios.get(params.Body.item,{responseType:"arraybuffer" })
                .then((data) => {
                    let toUpload = params
                    
                    const file = fs.writeFile("./NFTemp",data.data,(err)=>{
                        if(err)
                        console.log("err is: "+err)
                    })
                    const stream = fs.createReadStream("NFTemp")
                    toUpload.Body = data.data//stream
                    s3.upload(toUpload, async (err: any, data: any) => {
                        if (err) {
                            console.log("error in s3.upload inside upload function inside addNFT function: " + err);
                            res.send("error in s3.upload inside upload function inside addNFT function: " + err)
                            return
                        }
                        console.log("4. upload done successfully")
                        resolve(data.Location)

                    })

                    

                })
                .catch((error) => {
                    console.log("error in axios in upload function is: " + error)
                    res.send("error in axios in upload function is: " + error)
                    return
                })

        } catch (error) {

            res.status(400).send("general error in upload func is: " + error)
        }


    })
}

//function to check if the uri is HTTPS or IPFS
const checker = (uri: string) => {
    if (!uri) {
        console.log("no uri was sent or res was not received")
        const errorObj = {
            num: -2,
            item: "no uri was sent or res was not received"
        }
        return errorObj
    }

    try {
        console.log("2.1 inside checker")
        let cond = (uri.indexOf("http://") == 0 || uri.indexOf("https://") == 0)
        if (cond) {
            const obj = {
                num: 0,
                item: uri
            }
            return obj
        }

        //checking if the uri is with ipfs prefix
        cond = (uri.indexOf("ipfs://") == 0)
        if (cond) {
            const newUri = formatURI(uri)
            if (newUri == -4) {
                const errorObj = {
                    num: -4,
                    item: "no uri was sent to formatURI function"
                }
                return errorObj

            }
            else {
                const obj = {
                    num: 0,
                    item: newUri
                }
                return obj
            }
        }

    } catch (error) {
        const errorObj = {
            num: -3,
            item: error
        }
        return errorObj
    }

}

//function to format IPFS to standard HTTPS uri
const formatURI = (uri: string) => {

    if (!uri) {
        return -4
    }

    console.log("2.1.1 formatting uri to https")
    let _uri = uri
    _uri = uri.slice(7)
    _uri = "https://ipfs.io/ipfs/" + _uri
    return _uri

}

//FOR TESTING PURPOSES ONLY!!!!!!
export const deleteObjects = (req: any, res: any) => {

    const params = {
        Bucket: bucket_name || ""
    }
    s3.listObjects(params, (err, data) => {
        if (data.Contents) {
            for (let i = 0; i < data.Contents.length; i++) {
                console.log(`obj ${i} is: ` + (data.Contents)[i].Key)
                const params = {
                    Bucket: bucket_name || "",
                    Key: (data.Contents)[i].Key || ""
                }
                s3.deleteObject(params, (err, data) => {
                    console.log(`data: ${i} ` + data)
                })
            }
        }
    })
    res.send("done")
}