import NFT, { INFT, INFTDocument } from './models/nft'
import { s3 } from "./s3/s3Client";
import { bucket_name, ACL } from './helpers/consts'
import { dataToNFTObj, dataToParams } from './helpers/helpers';

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
    if (!bucket_name || !ACL || !(metaData.image)) {
        console.log("bucket name or ACL or image uri is missing for params")
        res.send("bucket name or ACL or image uri is missing for params")
        return
    }

    const params = dataToParams(chainId, tokenId, contract, metaData.image)


    let obj = dataToNFTObj(chainId, tokenId, owner, name, symbol, contract, contractType, metaData)


    let newMetaData = metaData//new meta data
    await upload(params, res)
        .then(async (imageUri) => {
            if (!imageUri) {
                res.send("no image uri received back")
                return
            }
            console.log("4. image retrieved successfully")
            newMetaData.image = imageUri
            obj.metaData = newMetaData

            //uploading to mongoDB
            try {
                console.log("5. creating new NFT in mongoDB")
                const result: any = await NFT.addToCache(obj)
                //if the NFT already exists in the cache it will "result" will be the id of that NFT
                //if it doesn't exist, "result" will be the newly created NFT 
                if (result.exists == 1) {
                    console.log(`such NFT already exists in cache with id: ${result.id}`);
                    res.status(200).send(`such NFT already exists in cache with id: ${result.id}`)
                    return
                }
                if (result.exists == 0) {
                    console.log("6. NFT record created")
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
            }
            console.log("2. starting an upload to s3 bucket...")
            //upload to s3 photos bucket
            s3.upload(params, async (err: any, data: any) => {
                if (err) {
                    console.log("error in s3.upload inside upload function inside addNFT function: " + err);
                    res.send("error in s3.upload inside upload function inside addNFT function: " + err)
                    return
                }
                console.log("3. upload done successfully, retrieving image...")
                resolve(data.Location)
            })
        } catch (error) {

            res.status(404).send("general error in upload func is: " + error)
        }


    })
}

//FOR TESTING PURPOSES ONLY!!!!!!
export const deleteObjects = (req: any, res: any) => {

    const params = {
        Bucket: bucket_name || ""
    }
    s3.listObjects(params, (err, data) => {
        if (data.Contents) {
            for (let i = 0; i < data.Contents.length; i++)
            {
                console.log(`obj ${i} is: `+(data.Contents)[i].Key)
                const params={
                    Bucket: bucket_name || "",
                    Key:(data.Contents)[i].Key||""
                }
                s3.deleteObject(params,(err,data)=>{
                    console.log(`data: ${i} `+data)
                })
            }
        }
    })
    res.send("done")
}