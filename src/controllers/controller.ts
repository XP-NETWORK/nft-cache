import NFT, { INFT } from "../models/nft";
import { s3 } from "../s3/s3Client";
import { bucket_name, bot, chat_id } from "../helpers/consts";
import {
  dataToNFTObj,
  dataToParams,
  paramsForFile,
  dataToNFTObjFile,
} from "../helpers/helpers";
import axios, { AxiosError, AxiosResponse } from "axios";
import fs from "fs";
import {
  sendInitMessage,
  sendNewNFTCachedMessage,
  sendNFTexistsMessage,
  sendUploadedMessage,
} from "../helpers/telegram";
import request from "request";
//import e from 'connect-timeout';
import stream, { PassThrough, Readable } from "stream";
import { Request } from "express";

import BigNumber from "bignumber.js";

import { S3 } from "aws-sdk";
import { resolve } from "path/posix";

const currentyFetching: string[] = [];

const myAxios = (baseurl: string) =>
  axios.create({
    baseURL: baseurl,
    timeout: 60000,
    responseType: "arraybuffer",
  });

//get the metadata back by the url (retrieving ONLY the metadata)
export const getByURI = async (req: Request, res: any) => {
  const uri = req?.query?.uri as string;

  if (!uri) {
    res.status(401).send("no url given");
    return;
  }
  try {
    const result: any = await NFT.getByURI(uri);
    if (result) {
      res.status(200).send(result.metaData);
      return;
    } else {
      res.status(200).send("no such NFT found");
      return;
    }
  } catch (error) {
    res.status(400).send("problem in getByURI, error is: " + error);
    return;
  }
};

//getting the metadata by chain id, smart contract adderss and token id (retrieves ONLY the metadata)
//ALL THREE ARE REQUIRED
export const getByData = async (req: Request, res: any) => {
  const { chainId, contract = "", tokenId } = req.query;

  const tm = Date.now();
  if (!chainId /*|| !contract*/ || !tokenId) {
    res
      .status(400)
      .send(
        "there was a problem with your request, you didn't send id/contract/token"
      );
    return;
  }
  try {
    const result: INFT = await NFT.getByData(
      contract as string,
      chainId as string,
      tokenId as string
    );

    if (result) {
      res.status(200).send(result.metaData);
      return;
    } else {
      res.status(200).send("no NFT with that data was found");
      return;
    }
  } catch (error: any) {
    console.log(error);
    res.status(400).send("problem with getNftFromToken, error is: ");
  }
};

export const addNFT = async (req: any, res: any) => {
  // process.on('uncaughtException', err => {
  //     console.log('There was an uncaught error', err);

  //     return
  //     //process.exit(1); // mandatory (as per the Node.js docs)
  // });
  try {
    //sendInitMessage()
    const {
      chainId,
      tokenId,
      owner,
      uri,
      contract = "",
      contractType,
      metaData,
      misc,
    } = req.body;

    if (!chainId || !tokenId /*|| !contract*/ || !metaData) {
      console.log("chainId/tokenId/contract/metaData is missing");
      res.send("chainId/tokenId/contract/metaData is missing");
      return;
    }
    //creating parameters for uploading to S3 bucket
    if (!(metaData.image || metaData.animation_url)) {
      console.log("image/vid");
      res.send("image/video uri is missing for params");
      return;
    }

    if (!(metaData.imageFormat || metaData.animation_url_format)) {
      console.log("no formats");
      res.send(
        "no format was sent in metadata, please add the format and send again"
      );
      return;
    }

    let formattedImageURI: any;
    if (metaData.image) {
      formattedImageURI = checker(metaData.image);
      if (formattedImageURI.num < 0) {
        res.send("error is: " + formattedImageURI.item);
        return;
      }
    }
    let formattedVideoURI: any;
    if (metaData.animation_url) {
      formattedVideoURI = checker(metaData.animation_url);
      if (formattedVideoURI.num < 0) {
        res.send("error is: " + formattedVideoURI.item);
        return;
      }
    }

    let imageNvideo: any;
    if (formattedImageURI && !formattedVideoURI) {
      imageNvideo = {
        item: formattedImageURI.item,
        //image: formattedImageURI.item,
        //imageFormat: metaData.imageFormat
        twoItems: 0,
      };
    } else if (formattedVideoURI && !formattedImageURI) {
      imageNvideo =
        //formattedVideoURI.item
        {
          item: formattedVideoURI.item,
          //image: formattedImageURI.item,
          //imageFormat: metaData.imageFormat
          twoItems: 0,
          //video: formattedVideoURI.item,
          //video_format: metaData.animation_url_format
        };
    } else if (formattedImageURI && formattedVideoURI) {
      imageNvideo = {
        image: formattedImageURI.item,
        //imageFormat: metaData.imageFormat,
        video: formattedVideoURI.item,
        //video_format: metaData.animation_url_format
        twoItems: 1,
      };
    }

    const params: any = dataToParams(chainId, tokenId, contract, imageNvideo);
    //const misc = req.body.misc
    let obj: any;

    const myUri: any = getMyUri(metaData);

    if (misc === undefined) {
      obj = dataToNFTObj(
        myUri,
        chainId,
        tokenId,
        contract,
        metaData,
        undefined
      );
    } else {
      obj = dataToNFTObj(myUri, chainId, tokenId, contract, metaData, misc);
    }

    let newMetaData = metaData; //new meta data
    let errorObj: any = 0;

    try {
      //when image
      if (formattedImageURI && !formattedVideoURI) {
        //console.log(formattedImageURI)
        try {
          let MB = await getSize(formattedImageURI.item);
          if (!MB) return res.send(`timeout on fetching ${formattedImageURI}`);

          console.log("my MB: ", MB);

          if (MB >= 5 || isNaN(MB)) {
            //console.log("still going in")
            try {
              NFT.addToCache(obj, 1);
            } catch (e) {}

            res.send(
              `without uploading ${params?.params?.Key || params?.Key} to AWS`
            );
            return;
          }

          try {
            res.send(`uploading ${params?.params?.Key || params?.Key} to AWS`);

            uploadImage(params, metaData)
              .then(async (imageURI: any) => {
                console.log(imageURI);
                if (!imageURI || imageURI.num < 0) {
                  return;
                }

                newMetaData.image = imageURI;
                obj.metaData = newMetaData;
                NFT.addToCache(obj, 1);
              })
              .catch(() => {});
          } catch (error) {
            console.log(error, "when image");
            return;
          }

          return;
        } catch (error) {
          res.send(error);
          return;
        }
      }

      //when video
      if (!formattedImageURI && formattedVideoURI) {
        try {
          const MB: any = await getMB(formattedVideoURI);

          if (MB >= 5 || isNaN(MB)) {
            newMetaData.video /*animation_url*/ = formattedVideoURI.item;
            obj.metaData = newMetaData;
            try {
              NFT.addToCache(obj, 1);
            } catch (e) {}
            res.send(
              `without uploading ${params?.params?.Key || params?.Key} to AWS`
            );
            return;
          }

          res.send(`uploading ${params?.params?.Key || params?.Key} to AWS`);
          uploadImage(params, metaData)
            .then(async (videoURI) => {
              newMetaData.video /*animation_url*/ = videoURI;
              obj.metaData = newMetaData;
              NFT.addToCache(obj, 1);
            })
            .catch(() => {});
          return;
        } catch (error) {
          console.log(error, "when video");
          return;
        }
      }

      if (formattedImageURI && formattedVideoURI) {
        console.log("both");
        const { imageParams, videoParams } = params;
        console.log(imageParams, videoParams);
        console.log(newMetaData);
        console.log(obj);
        try {
          res.send(`uploading ${params?.params?.Key || params?.Key} to AWS`);

          await Promise.all([
            (async () => {
              let MB: any = await getMB(formattedImageURI);
              if (MB && MB < 5) {
                uploadImage(imageParams, metaData)
                  .then(async (imageURI) => {
                    newMetaData.image = imageURI;
                    //obj.metaData = newMetaData
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              }
            })(),
            (async () => {
              let MB: any = await getMB(formattedVideoURI);
              if (MB && MB < 5) {
                uploadImage(videoParams, metaData)
                  .then(async (videoURI) => {
                    newMetaData.video = videoURI;
                    //obj.metaData = newMetaData
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              }
            })(),
          ]);
          obj.metaData = newMetaData;
          NFT.addToCache(obj, 1);
          return;
        } catch (error) {
          console.log(error);
          res.send(error);
          return;
        }
      }
    } catch (error) {
      console.log(error);
      res.send(error);
      return;
    }
  } catch (err) {
    console.log(err);
    res.send(err);
    return;
  }

  // if (errorObj.num < 0) {
  //     console.log("a")
  //     res.send(errorObj.data)
  //     return
  // }
};

//#region Helper functions for addNFT function

//inner function to upload an image to AWS s3 bucket and retrieve the image uri back

//a function to a get a file's size in MB from the url
const getMB = async (uri: any) => {
  try {
    return await new Promise((resolve: any, reject: any) => {
      request(
        {
          url: uri.item,
          method: "HEAD",
          timeout: 8000,
        },
        function (err, response, body) {
          if (err) {
            resolve(6);
          }
          if (response && response.headers) {
            let bytes: any = response.headers["content-length"];
            let MB: any = bytes / (1000 * 1000);
            console.log("MB: " + MB);
            resolve(MB);
          } else {
            reject(undefined);
          }
        }
      );
    });
  } catch (e) {}
};

//a function to get the image's/video's uri
const getMyUri = (metaData: any) => {
  if (metaData.animation_url && (metaData.image === "" || !metaData.image)) {
    return metaData.animation_url;
  } else {
    return metaData.image;
  }
};

//function to upload image to AWS
const uploadImage = async (params: any, metaData: any) => {
  try {
    return new Promise(async (resolve: any, reject: any) => {
      if (!params) {
        return;
      }

      // let toUpload: any = params.params
      let toUpload: any = params.params ? params.params : params;

      const searchParams = {
        Bucket: bucket_name || "",
        Key: toUpload.Key,
        ObjectAttributes: ["ObjectSize"],
      };

      //checking inside the bucket to see if we don't have duplicates

      await s3
        .getObjectAttributes(searchParams, (err, data) => {
          if (data) {
            console.log("same image ");
            resolve(toUpload.Body);
          }
        })
        .promise()
        .catch(() => {});

      let typeBody = params.Body ? params.Body : params.params.Body;
      try {
        console.log("start stream ", toUpload.Key);
        const newImage = await streamFileToS3(typeBody, toUpload.Key);
        resolve(newImage);
      } catch (e: any) {
        console.log(e.code, "streamFileToS3");
        reject(e.code);
      }

      /* await retrieveFileData(typeBody)
        .then(async (data: any) => {
          if (!data) {
            return;
          }
          toUpload["Body"] = data.data;
          let newImage = s3
            .upload(toUpload, async (err: any, data: any) => {
              if (err) {
                return;
              }
            })
            .promise()
            .then((n) => n.Location);

          resolve(newImage);
        })
        .catch((error) => {
          return;
        });*/
    });
  } catch (e) {
    return;
  }
};

//function to upload video to AWS
const uploadVideo = async (params: any, metaData: any, res: any) => {
  try {
    return await new Promise(async (resolve: any, reject: any) => {
      if (!params || !res) {
        return;
      }

      let toUpload: any = params.params ? params.params : params;

      const searchParams = {
        Bucket: bucket_name || "",
        Key: toUpload.Key,
        ObjectAttributes: ["ObjectSize"],
      };

      s3.getObjectAttributes(searchParams, (err, data) => {
        if (data) {
          resolve(toUpload.Body);
        }
      })
        .promise()
        .then((n) => n)
        .catch(() => {});

      //actually retreiving file data (image OR video)
      let typeBody = params.Body ? params.Body : params.params.Body;

      await retrieveFileData(typeBody)
        .then(async (data: any) => {
          if (!data) {
            return;
          }

          //checks what the data is- if error or a valid file

          /*
                            const maybeError: any = checkData(data, res)
                            if (maybeError.num === -7 || maybeError.num === -6 || maybeError.num === -5) {
                                res.send(maybeError.message)
                                return
                            }*/

          toUpload["Body"] = data.data;
          let newVideo = await s3
            .upload(toUpload, async (err: any, data: any) => {
              if (err) {
                return;
              }
            })
            .promise()
            .then((n) => n.Location);
          resolve(newVideo);
        })
        .catch((error) => {
          return;
        });
    });
  } catch (e) {
    return;
  }
};

//function to check if the uri is HTTPS or IPFS
const checker = (uri: string) => {
  if (!uri) {
    return;
  }

  try {
    let cond = uri.indexOf("http://") === 0 || uri.indexOf("https://") === 0;
    if (cond) {
      return {
        num: 0,
        item: uri,
      };
    }

    //checking if the uri is with ipfs prefix
    cond = uri.indexOf("ipfs://") === 0;
    if (cond) {
      const newUri = formatURI(uri);
      if (!newUri) {
        return;
      } else {
        return {
          num: 0,
          item: newUri,
        };
      }
    }
  } catch (error) {
    return;
  }
};

//function to format IPFS to standard HTTPS uri
const formatURI = (uri: string) => {
  if (!uri) {
    return;
  } else if (uri.indexOf("ipfs://") === 0) {
    let _uri = uri;
    _uri = uri.slice(7);
    _uri = "https://ipfs.io/ipfs/" + _uri;
    return _uri;
  } else {
    return uri;
  }
};

//function to retrieve file data from media uri
const retrieveFileData = async (mediaURI: any) => {
  try {
    return await new Promise(async (resolve: any, reject: any) => {
      if (!mediaURI) {
        return;
      }

      let _data = await myAxios(mediaURI)
        .get("")
        //let _data = await axios.get(mediaURI, { timeout: 60000, responseType: "arraybuffer" })
        .then((data) => (data.data ? data.data : undefined))
        .catch(() => {});

      if (_data) {
        resolve({
          num: 0,
          data: _data,
        });
      } else {
        reject(undefined);
      }
    });
  } catch (e) {
    return;
  }
};

//function to check data received from retrieveFileData function
const checkData = (data: any, res: any) => {
  if (!data || !res) {
    return;
  }

  switch (data.num) {
    case -5: {
      return -5;
    }
    case -6: {
      return -6;
    }
  }

  return 0;
};

//#endregion

export const fileAdder = async (req: any, res: any) => {
  const uri = req.body.uri;
  if (!uri) {
    res.send("no uri received");
    return;
  }
  try {
    const location = await fileUpload(uri, res);
    const obj = dataToNFTObjFile(uri, { uri: location });
    if (obj) {
      await NFT.addToCacheFile(obj, res);
      return;
    } else {
      res.send("no object returned from dataToNFTObj function");
      return;
    }
  } catch (e) {
    return;
  }
};

const fileUpload = async (uri: string, res: any) => {
  try {
    return await new Promise(async (resolve: any, reject: any) => {
      try {
        if (!uri || !res) {
          return;
        }

        // const searchParams = {
        //     Bucket: bucket_name || ""
        // }
        let params: any = paramsForFile(uri);

        const searchParams = {
          Bucket: bucket_name || "",
          Key: params.Key,
          ObjectAttributes: ["ObjectSize"],
        };

        try {
          //checking inside the bucket to see if we don't have duplicates
          s3.getObjectAttributes(searchParams, (err, data) => {
            if (data) {
              resolve(params.Body);
            }
          })
            .promise()
            .then((n) => n)
            .catch(() => {});

          /*s3.listObjects(searchParams, (err, data) => {
                        try {


                            if (err) {
                                throw new Error(`${err}`)
                            }

                            if (data.Contents) {
                                for (let i = 0; i < data.Contents.length; i++) {
                                    if ((data.Contents)[i].Key === params.Key) {
                                        const message = `object with key ${params.Key} already exists in bucket`
                                        console.log(`key exists: ${params.Key}`)
                                        throw new Error(` {
                                        num: -8,
                                        data: ${message}
                                    }`)
                                    }

                                }
                            }
                        } catch (error) {
                            throw new Error(`${error}`)
                        }
                    })*/
        } catch (error) {
          reject(undefined);
        }
        //actually retreiving file data (image OR video)

        //let typeBody = params.Body ? params.Body : params.params.Body
        try {
          await retrieveFileData(uri)
            .then(async (data: any) => {
              if (!data) {
                return;
              }

              params.Body = data.data;

              try {
                let uploaded = await s3
                  .upload(params, async (err: any, data: any) => {
                    if (err) {
                      return;
                    }
                  })
                  .promise()
                  .then((n) => n.Location);
                resolve(uploaded);
              } catch (e) {
                reject(undefined);
              }
            })
            .catch((error) => {
              reject(undefined);
            });
        } catch (error) {
          reject(undefined);
        }
      } catch (error) {
        reject(undefined);
      }
    });
  } catch (e) {
    return;
  }
};

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

const uploadFromStream = (
  fileResponse: AxiosResponse,
  fileName: string,
  bucket: string
): {
  passThrough: PassThrough;
  promise: Promise<S3.ManagedUpload.SendData>;
} => {
  const passThrough = new PassThrough();

  const promise = s3
    .upload({
      Bucket: bucket,
      Key: fileName,
      ContentType: fileResponse.headers["content-type"],
      ContentLength: Number(fileResponse.headers["content-length"]),
      Body: passThrough,
    })
    .promise();
  return { passThrough, promise };
};

const streamFileToS3 = async (url: string, Key: string) => {
  const responseStream = await axios
    .get(url, {
      responseType: "stream",
    })
    .catch((e) => {
      throw e;
    });

  const { passThrough, promise } = uploadFromStream(
    responseStream,
    Key,
    bucket_name || ""
  );

  responseStream.data.pipe(passThrough);

  return promise
    .then((result) => {
      console.log(`finish stream ${Key}`);
      return result.Location;
    })
    .catch((e) => {
      throw e;
    });
};

export const testRoute = async (req: any, res: any) => {
  /*const params = {
    Bucket: bucket_name || "",
    Prefix: "2-",
  };
  s3.listObjects(params, (err, data) => {
    var start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    if (data && data.Contents?.length) {
      for (let i = 0; i < data.Contents?.length; i++) {
        if (data.Contents[i].Key?.includes("ORC")) {
          s3.deleteObject(
            {
              Bucket: bucket_name || "",
              Key: data.Contents[i].Key!,
            },
            (err, data) => {
              console.log(`data: ${i} ` + data);
            }
          );
        }
      }
    }
  });*/

  const params = {
    Bucket: bucket_name || "",
    Key: "23-0xD6939f722B977afd7DD934A31bc94d08d4ea4336-30463248987618308474467145162",
  };

  s3.deleteObject(
    {
      Bucket: bucket_name || "",
      Key: params.Key,
    },
    (err, data) => {
      console.log(data);
    }
  );

  res.end();
};

const getSize = (url: string): Promise<number | undefined> =>
  new Promise(async (resolve, reject) => {
    console.log("start stream");
    const responseStream = await axios
      .get(url, {
        responseType: "stream",
        timeout: 8000,
      })
      .catch((e: AxiosError) => {
        console.log(e);
        if (e.code === "ECONNABORTED") {
          console.log("timeout");
          return reject(undefined);
        }
      });

    let size = 0;

    responseStream?.data.on("data", (chunk: ArrayBuffer) => {
      size += Buffer.byteLength(chunk);
      if (size >= 5000000) {
        responseStream.data?.destroy();
      }
    });
    responseStream?.data.on("end", () => {
      console.log("end");
      resolve(new BigNumber(size.toString()).shiftedBy(-6).toNumber());
    });
    responseStream?.data.on("close", (err: any) => {
      console.log("close");
      resolve(new BigNumber(size.toString()).shiftedBy(-6).toNumber());
    });
  });
