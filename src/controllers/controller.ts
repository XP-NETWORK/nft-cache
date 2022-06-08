import NFT, { INFT } from '../models/nft'
import { s3 } from "../s3/s3Client";
import { bucket_name, bot, chat_id } from '../helpers/consts'
import { dataToNFTObj, dataToParams, paramsForFile } from '../helpers/helpers';
import axios from 'axios';
import fs from 'fs'
import { sendInitMessage, sendNewNFTCachedMessage, sendNFTexistsMessage, sendUploadedMessage } from '../helpers/telegram';
import { rejects } from 'assert';

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
        const result: any = await NFT.getByURI(uri)
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
    sendInitMessage()

    const { chainId, tokenId, owner, uri, contract, contractType, metaData, misc } = req.body
    if (!chainId || !tokenId || !contract || !metaData) {
        res.send("chainId/tokenId/contract/metadata is missing")
        return
    }
    //creating parameters for uploading to S3 bucket
    if (!(metaData.image || metaData.animation_url)) {
        res.send("image/video uri is missing for params")
        return
    }

    if (!((metaData.imageFormat) || (metaData.animation_url_format))) {
        res.send("no format was sent in metadata, please add the format and send again")
        return
    }
    let formattedImageURI: any
    if (metaData.image) {
        formattedImageURI = checker(metaData.image)
        if (formattedImageURI.num < 0) {
            res.send("error is: " + formattedImageURI.item)
            return
        }
    }
    let formattedVideoURI: any
    if (metaData.animation_url) {
        formattedVideoURI = checker(metaData.animation_url)
        if (formattedVideoURI.num < 0) {
            res.send("error is: " + formattedVideoURI.item)
            return
        }
    }


    let imageNvideo: any
    if (formattedImageURI && !formattedVideoURI) {
        imageNvideo = {
            item: formattedImageURI.item,
            //image: formattedImageURI.item,
            //imageFormat: metaData.imageFormat
            twoItems: 0
        }
    }

    else if (formattedVideoURI && !formattedImageURI) {
        imageNvideo = //formattedVideoURI.item 
        {
            item: formattedVideoURI.item,
            //image: formattedImageURI.item,
            //imageFormat: metaData.imageFormat
            twoItems: 0
            //video: formattedVideoURI.item,
            //video_format: metaData.animation_url_format
        }
    }

    else if (formattedImageURI && formattedVideoURI) {
        imageNvideo = {
            image: formattedImageURI.item,
            //imageFormat: metaData.imageFormat,
            video: formattedVideoURI.item,
            //video_format: metaData.animation_url_format
            twoItems: 1
        }
    }



    const params: any = dataToParams(chainId, tokenId, contract, imageNvideo)
    //const misc = req.body.misc
    let obj: any
    if (misc === undefined) {
        obj = dataToNFTObj(chainId, tokenId, contract, metaData, undefined)
    }
    else {
        obj = dataToNFTObj(chainId, tokenId, contract, metaData, misc)
    }

    let newMetaData = metaData//new meta data
    let errorObj: any = 0


    //when image
    if (formattedImageURI && !formattedVideoURI) {
        await uploadImage(params, metaData, res)
            .then(async (imageURI) => {

                newMetaData.image = imageURI
                obj.metaData = newMetaData
                await NFT.addToCache(obj, res, 1)
            })
            .catch((err) => {
                res.send("error in image uploading is: " + err)
            })

        return
    }
    //when video
    if (!formattedImageURI && formattedVideoURI) {
        await uploadVideo(params, metaData, res)
            .then(async (videoURI) => {

                newMetaData.animation_url = videoURI
                obj.metaData = newMetaData
                await NFT.addToCache(obj, res, 1)
                return
            })
            .catch((err) => {
                res.send("error in video uploading is: " + err)
            })
    }

    if (formattedImageURI && formattedVideoURI) {

        console.log("entered")

        console.log(params);
        const { imageParams, videoParams } = params
        await uploadImage(imageParams, metaData, res)
            .then(async (imageURI) => {
                newMetaData.image = imageURI

            })
            .catch((err) => {
                res.send("error in image uploading is: " + err)
            })

        await uploadVideo(videoParams, metaData, res)
            .then(async (videoURI) => {
                newMetaData.video = videoURI
                console.log("success too")

            })

            .catch((err) => {
                res.send("error in image and video uploading is: " + err)
            })
        await NFT.addToCache(obj, res, 1)

        obj.metaData = newMetaData
        return

    }

    /*errorObj = await upload(params, metaData, res)
        .then(async (mediaUri: any) => {            
            if (!mediaUri) {
                res.send("no image uri received back")
                return
            }
            try {
                if (metaData.image && !metaData.animation_url) {
                    newMetaData.image = mediaUri.location1
                    obj.metaData = newMetaData
                    const result: any = await NFT.addToCache(obj, res, 1)
                    return
                }
                if (!metaData.image && metaData.animation_url) {
                    newMetaData.video = mediaUri.location1
                    obj.metaData = newMetaData
                    const body = obj;
                    console.log("6. creating new NFT in mongoDB")
                    const result: any = await NFT.addToCache(obj, res, 1)
                    return
                }
                if (metaData.image && metaData.animation_url) {

                    newMetaData.image = mediaUri.location1
                    newMetaData.video = mediaUri.location2
                    obj.metaData = newMetaData

                    const body = obj;

                    //res.send(obj)
                    console.log("data sent to user, continuing with caching")

                    //uploading to mongoDB
                    console.log("6. creating new NFT in mongoDB")
                    const result: any = await NFT.addToCache(obj, res, 2)
                    return
                }
            } catch (error) {
                res.status(400).send("couldn't add nft to the cache: " + error)
                return
            }

        })
        .catch((err) => {
            res.send("error in upload call in addNFT function is: " + err)
            return
        })*/

    console.log(errorObj);

    // if (errorObj.num < 0) {
    //     console.log("a")
    //     res.send(errorObj.data)
    //     return
    // }

}



//#region Helper functions for addNFT function

//inner function to upload an image to AWS s3 bucket and retrieve the image uri back

const uploadImage = async (params: any, metaData: any, res: any) => {
    return await new Promise(async (resolve: any, reject: any) => {

        try {
            if (!params || !res) {
                return {
                    num: -1,
                }
            }

            const searchParams = {
                Bucket: bucket_name || ""
            }

            // let toUpload: any = params.params
            let toUpload: any = params.params ? params.params : params


            //checking inside the bucket to see if we don't have duplicates
            s3.listObjects(searchParams, (err, data) => {
                if (err) {
                    console.log("err in s3.listObjects in upload is: " + err)
                }
                if (data.Contents) {
                    for (let i = 0; i < data.Contents.length; i++) {
                        if ((data.Contents)[i].Key === toUpload.Key) {
                            const message = `object with key ${toUpload.Key} already exists in bucket`
                            console.log(message)
                            return {
                                num: -8,
                                data: message
                            }
                        }

                    }
                }
            })

            //actually retreiving file data (image OR video)


            let typeBody = params.Body ? params.Body : params.params.Body

            await retrieveFileData(typeBody)
                .then(async (data: any) => {
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

                    console.log(toUpload);
                    toUpload["Body"] = data.data

                    let newImage = s3.upload(toUpload, async (err: any, data: any) => {
                        if (err) {
                            console.log("error in s3.upload inside upload function inside addNFT function: " + err);
                            res.send("error in s3.upload inside upload function inside addNFT function: " + err)
                            return
                        }
                        console.log("4. upload done successfully")

                    }).promise().then(n => n.Location);

                    resolve(newImage)

                })
                .catch((error) => {
                    console.log("error in retrieveFileData for image in upload function is: " + error)
                    res.send("error in retrieveFileData for image in upload function is: " + error)
                    return
                })





        } catch (error) {

            res.status(400).send("general error in upload func is: " + error)
        }


    })
}
const uploadVideo = async (params: any, metaData: any, res: any) => {
    return await new Promise(async (resolve: any, reject: any) => {

        try {
            if (!params || !res) {
                return {
                    num: -1,
                }
            }

            const searchParams = {
                Bucket: bucket_name || ""
            }


            console.log(params);

            let toUpload: any = params.params ? params.params : params
            //checking inside the bucket to see if we don't have duplicates
            s3.listObjects(searchParams, (err, data) => {
                if (err) {
                    console.log("err in s3.listObjects in upload is: " + err)
                }
                if (data.Contents) {
                    for (let i = 0; i < data.Contents.length; i++) {
                        if ((data.Contents)[i].Key === toUpload.Key) {
                            const message = `object with key ${toUpload.Key} already exists in bucket`
                            console.log(message)
                            return {
                                num: -8,
                                data: message
                            }
                        }

                    }
                }
            })

            //actually retreiving file data (image OR video)
            let typeBody = params.Body ? params.Body : params.params.Body

            await retrieveFileData(typeBody)
                .then(async (data: any) => {
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

                    toUpload["Body"] = data.data

                    let newVideo = await s3.upload(toUpload, async (err: any, data: any) => {
                        if (err) {
                            console.log("error in s3.upload inside upload function inside addNFT function: " + err);
                            res.send("error in s3.upload inside upload function inside addNFT function: " + err)
                            return
                        }
                        console.log("4. upload done successfully")
                    }).promise().then(n => (n.Location))
                    resolve(newVideo)

                })
                .catch((error) => {
                    console.log("error in retrieveFileData for image in upload function is: " + error)
                    res.send("error in retrieveFileData for image in upload function is: " + error)
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
    if (uri.indexOf("ipfs://") === 0) {
        console.log("2.1.1 formatting uri to https")
        let _uri = uri
        _uri = uri.slice(7)
        _uri = "https://ipfs.io/ipfs/" + _uri
        return _uri
    }
    else {
        return uri
    }

}

//function to retrieve file data from media uri
const retrieveFileData = async (mediaURI: any) => {
    return await new Promise(async (resolve: any, reject: any) => {
        if (!mediaURI) {
            console.log("no mediaURI received in retrieveFileData")
            return {
                num: -5,
                message: "no mediaURI received in retrieveFileData"
            }
        }

        //console.log("mediaUri is: "+mediaURI);
        try {
            const _data = await axios.get(mediaURI, { responseType: "arraybuffer" })
                .then((data) => data.data ? data.data : undefined)
                .catch((err) => {
                    return {
                        num: -6,
                        message: "problem with axios in retrieveFileData function inside axios promise is: " + err
                    }
                })
            if (_data) {
                resolve({
                    num: 0,
                    data: _data
                })
            }
        } catch (error) {
            console.log("error: "+error)
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



export const fileAdder = async (req: any, res: any) => {

    const uri = req.body.uri
    if (!uri) {
        res.send("no uri received")
        return
    }
    try {
        console.log(uri);

        const location = await fileUpload(uri, res)

        console.log("this is the location: ", location)

        const obj = dataToNFTObj(0, 0, 0, { uri: location }, {})

        if (obj) {
            await NFT.addToCacheFile(obj, res)
            return
        }
        else {
            res.send("no object returned from dataToNFTObj function")
            return
        }
    } catch (e) {

    }


}


const fileUpload = async (uri: string, res: any) => {
    {
        return await new Promise(async (resolve: any, reject: any) => {

            try {
                if (!uri || !res) {
                    return {
                        num: -1,
                    }
                }

                const searchParams = {
                    Bucket: bucket_name || ""
                }

                let params: any = paramsForFile(uri)

                console.log(params)

                //checking inside the bucket to see if we don't have duplicates
                s3.listObjects(searchParams, (err, data) => {
                    if (err) {
                        console.log("err in s3.listObjects in upload is: " + err)
                    }
                    if (data.Contents) {
                        for (let i = 0; i < data.Contents.length; i++) {
                            if ((data.Contents)[i].Key === params.Key) {
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

                //actually retreiving file data (image OR video)


                //let typeBody = params.Body ? params.Body : params.params.Body            

                await retrieveFileData(uri)
                    .then(async (data: any) => {
                        if (!data) {
                            console.log("no data was received from axios in upload function")
                            res.send("no data was received from axios in upload function")
                            return
                        }

                        console.log("data.data: ", data.data)

                        params.Body = data.data


                        try {
                            let uploaded = await s3.upload(params, async (err: any, data: any) => {
                                if (err) {
                                    res.send("error in s3.upload inside upload function inside addNFT function: " + err)
                                    return
                                }

                            }).promise().then(n => n.Location);
                            resolve(uploaded)
                        } catch (e) {
                            console.log("error in s3.upload when uploading in uploadFile function" + e)
                        }
                    })
                    .catch((error) => {
                        console.log("error in retrieveFileData for image in upload function is: " + error)
                        res.send("error in retrieveFileData for image in upload function is: " + error)
                        return
                    })





            } catch (error) {

                res.status(400).send("general error in upload func is: " + error)
            }


        })
    }
}


//FOR TESTING PURPOSES ONLY!!!!!!
/*export const deleteObjects = (req: any, res: any) => {

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
}*/






