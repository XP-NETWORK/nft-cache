import NFT, { INFT, INFTDocument } from './models/nft'
import { s3 } from "./s3/s3Client";
import { bucket_name, bot, chat_id } from './helpers/consts'
import { dataToNFTObj, dataToParams } from './helpers/helpers';
import axios from 'axios';
import fs from 'fs'
import { sendInitMessage, sendNewNFTCachedMessage, sendNFTexistsMessage, sendUploadedMessage } from './helpers/telegram';

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
    sendInitMessage()

    const { chainId, tokenId, owner, name, symbol, contract, contractType, metaData } = req.body
    if (!chainId || !tokenId || !contract || !metaData) {
        console.log("chainId/tokenId/contract/metadata is missing")
        res.send("chainId/tokenId/contract/metadata is missing")
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

    if (!(metaData.format)) {
        console.log("no format was sent in metadata, please add the format and send again")
        res.send("no format was sent in metadata, please add the format and send again")
        return
    }
    const params = dataToParams(chainId, tokenId, contract, formattedMediaURI, metaData.format)
    const misc = req.body.misc
    let obj: any
    if (misc === undefined) {
        obj = dataToNFTObj(chainId, tokenId, contract, metaData, undefined)
    }
    else {
        obj = dataToNFTObj(chainId, tokenId, contract, metaData, misc)
    }


    let newMetaData = metaData//new meta data
    let errorObj:any=0
    errorObj = await upload(params, res)
        .then(async (mediaUri: any) => {
            if (!mediaUri) {
                res.send("no image uri received back")
                return
            }
            if (errorObj.num < 0) {
                console.log("a")
                res.send(errorObj.data)
                return
            }
            
            console.log("b: ",errorObj)
            try {
                sendUploadedMessage(metaData.media, mediaUri)
                console.log("5. image retrieved successfully")
                newMetaData.media = mediaUri
                obj.metaData = newMetaData

                const body = obj;

                //res.send(obj)
                console.log("data sent to user, continuing with caching")

                //uploading to mongoDB
                console.log("6. creating new NFT in mongoDB")
                const result: any = await NFT.addToCache(obj, res)

            } catch (error) {
                res.status(400).send("couldn't add nft to the cache: " + error)
                return
            }

        })
        .catch((err) => {
            res.send("error in upload call in addNFT function is: " + err)
        })

}



//#region Helper functions for addNFT function

//inner function to upload an image to AWS s3 bucket and retrieve the image uri back
const upload = async (params: any, res: any) => {
    return new Promise((resolve: any, reject: any) => {

        try {
            if (!params || !res) {
                console.log("no params or res object were received in inner upload function ")
                return {
                    num: -1,
                    data: "no params or res object were received in inner upload function "
                }
            }
            console.log("3. starting an upload to s3 bucket...")

            const searchParams = {
                Bucket: params.Bucket || ""
            }
            s3.listObjects(searchParams, (err, data) => {
                if (err) {
                    console.log("err in s3.listObjects in upload is: " + err)
                }
                if (data.Contents) {
                    for (let i = 0; i < data.Contents.length; i++) {
                        if ((data.Contents)[i].Key == params.Key) {
                            const message = `object with key ${params.Key} already exists in bucket`
                            console.log(message)
                            return {
                                num: -8,
                                data: message
                            }
                        }

                    }
                }
            })

            //upload to s3 photos bucket


            retrieveFileData(params.Body.item)
                .then((data: any) => {

                    if (!data) {
                        console.log("no data was received from axios in upload function")
                        res.send("no data was received from axios in upload function")
                        return
                    }

                    //checks what the data is- if error or a valid file
                    const maybeError: any = checkData(data, res)
                    if (maybeError.num === -7 || maybeError.num === -6 || maybeError.num === -5) {
                        console.log(maybeError.message)
                        res.send(maybeError.message)
                        return
                    }

                    let toUpload = params
                    toUpload.Body = data.data
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
                    console.log("error in retrieveFileData in upload function is: " + error)
                    res.send("error in retrieveFileData in upload function is: " + error)
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
        return {
            num: -2,
            item: "no uri was sent or res was not received"
        }

    }

    try {
        console.log("2.1 inside checker")
        let cond = (uri.indexOf("http://") === 0 || uri.indexOf("https://") === 0)
        if (cond) {
            return {
                num: 0,
                item: uri
            }
        }

        //checking if the uri is with ipfs prefix
        cond = (uri.indexOf("ipfs://") === 0)
        if (cond) {
            const newUri = formatURI(uri)
            if (newUri === -4) {
                return {
                    num: -4,
                    item: "no uri was sent to formatURI function"
                }


            }
            else {
                return {
                    num: 0,
                    item: newUri
                }

            }
        }

    } catch (error) {
        return {
            num: -3,
            item: error
        }
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

//function to retrieve file data from media uri
const retrieveFileData = (mediaURI: string) => {
    return new Promise(async (resolve: any, reject: any) => {
        if (!mediaURI) {
            console.log("no mediaURI received in retrieveFileData")
            return {
                num: -5,
                message: "no mediaURI received in retrieveFileData"
            }
        }

        let _data: any
        await axios.get(mediaURI, { responseType: "arraybuffer" })
            .then((data) => {
                _data = data

            })
            .catch((err) => {
                return {
                    num: -6,
                    message: "problem with axios in retrieveFileData function inside axios promise is: " + err
                }
            })
        if (_data) {
            resolve({
                num: 0,
                data: _data.data
            })
        }

    })
}

//function to check data received from retrieveFileData function
const checkData = (data: any, res: any) => {
    if (!data || !res) {
        return {
            num: -7,
            message: "either data or res were not received in checkData function"
        }
    }

    switch (data.num) {
        case -5:
            {
                return -5
            }
        case -6:
            {
                return -6
            }
    }

    return 0

}

//#endregion



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