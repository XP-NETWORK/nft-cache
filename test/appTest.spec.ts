import request from 'supertest'
import chai, { expect } from 'chai'
import server from '../src/index'
import chaiHttp from 'chai-http'
import console from 'console'

const should = chai.should()

chai.use(chaiHttp)

//tests for GET methods: getByURI and getByData
/*
describe("server boot test", () => {
    it("server is created without error", function () {
        console.log("hello")
    })
})


describe("GET getByURI", () => {
    it("test 1 - simple get", async () => {

        const obj = {
            "chainId": "1234",
            "tokenId": "4567",
            "owner": "you",
            "collectionIdent": "someCollection",
            "uri": "https://uriimage.com",
            "contract": "0xsomeaddress",
            "contractType": "ERC721",
            "metaData": {
                "image": "ipfs://QmTNwCCf7sn8JY9tGmtcGW7nU269uYGAxiwPkLFMqeA2tB",
                "imageFormat": "png",
                "attributes": {
                    "tail": "blue",
                    "smile": "shimmering"
                }
            },
            "misc": {
                "name": "test 1",
                "symbol": "TEST"
            }
        }


        const result: any = await chai.request(server).post("/nft/add").send(obj)

        console.log("that's the uri: ", result.body.uri);


        const res = await chai.request(server).get(`/nft/uri?uri=${result.body.uri}`)
        console.log("something is: ", res)
        res.status.should.eq(200)
        res.body.should.have.property("image")

    })

    it("test 2 - no url given", async () => {
        const res = await chai.request(server).get(`/nft/uri`)
        console.log("res is: ", res)
        res.status.should.eq(401)
        res.should.have.property("text").eq("no url given")
    })

    it("test 3 - try to get a non-existing nft", async () => {
        const res = await chai.request(server).get(`/nft/uri?uri=abc`)
        console.log("something is: ", res)
        res.status.should.eq(200)
        res.should.have.property("text").eq("no such NFT found")

    })

})

describe("GET getByData", () => {

    it("test 1 - simple get request", async () => {
        const obj = {
            "name": "test 1",
            "symbol": "TEST",
            "chainId": "3210",
            "tokenId": "0987",
            "owner": "you",
            "uri": "https://urivideo.com",
            "contract": "0xsomeaddress1",
            "contractType": "ERC721",
            "metaData": {
                "animation_url": "https://firebasestorage.googleapis.com/v0/b/thing-1d2be.appspot.com/o/token%2Fasset-1580322028874?alt=media&token=af000dd7-3790-46e4-9da3-22cc4a40ee2e",
                "animation_url_format": "mp4"
            }
        }

        const result: any = await chai.request(server).post("/nft/add").send(obj)

        const res = await chai.request(server).get(`/nft/data?tokenId=${obj["tokenId"]}&chainId=${obj["chainId"]}&contract=${obj["contract"]}`)
        console.log("something is: ", res)
        res.status.should.eq(200)
        res.body.should.have.property("video")

    })


    it("test 2 - no data given", async () => {
        const res = await chai.request(server).get(`/nft/data`)
        console.log("res is: ", res)
        res.status.should.eq(400)
        res.should.have.property("text").eq("there was a problem with your request, you didn't send id/contract/token")
    })

    it("test 3 - try to get a non-existing nft", async () => {
        const res = await chai.request(server).get(`/nft/data?tokenId=123&chainId=456&contract=789`)
        console.log("moo is: ", res)
        res.status.should.eq(200)
        res.should.have.property("text").eq("no NFT with that data was found")

    })

})
*/

describe("POST add NFT",()=>{
    
    it("test 1 - missing parameter chainId when sending ",async ()=>{

        const obj = {
            
            "tokenId": "4567",
            "owner": "you",
            "collectionIdent": "someCollection",
            "uri": "https://uriimage.com",
            "contract": "0xsomeaddress",
            "contractType": "ERC721",
            "metaData": {
                "image": "ipfs://QmTNwCCf7sn8JY9tGmtcGW7nU269uYGAxiwPkLFMqeA2tB",
                "imageFormat": "png",
                "attributes": {
                    "tail": "blue",
                    "smile": "shimmering"
                }
            },
            "misc": {
                "name": "test 1",
                "symbol": "TEST"
            }
        }

        const result = await chai.request(server).post("/nft/add").send(obj)

        result.should.have.property("text").eq("chainId/tokenId/contract/metaData is missing")
    })


    it("test 2 - missing parameter image from metaData when sending ",async ()=>{

        const obj = {
            "chainId":"1234",
            "tokenId": "4567",
            "owner": "you",
            "collectionIdent": "someCollection",
            "uri": "https://uriimage.com",
            "contract": "0xsomeaddress",
            "contractType": "ERC721",
            "metaData": {
                //"image": "ipfs://QmTNwCCf7sn8JY9tGmtcGW7nU269uYGAxiwPkLFMqeA2tB",
                "imageFormat": "png",
                "attributes": {
                    "tail": "blue",
                    "smile": "shimmering"
                }
            },
            "misc": {
                "name": "test 1",
                "symbol": "TEST"
            }
        }

        const result = await chai.request(server).post("/nft/add").send(obj)

        result.should.have.property("text").eq("image/video uri is missing for params")
    })

    
    it("test 3 - missing parameter image from metaData when sending ",async ()=>{

        const obj = {
            "chainId":"1234",
            "tokenId": "4567",
            "owner": "you",
            "collectionIdent": "someCollection",
            "uri": "https://uriimage.com",
            "contract": "0xsomeaddress",
            "contractType": "ERC721",
            "metaData": {
                "image": "ipfs://QmTNwCCf7sn8JY9tGmtcGW7nU269uYGAxiwPkLFMqeA2tB",
                "imageFormat": "png",
                "attributes": {
                    "tail": "blue",
                    "smile": "shimmering"
                }
            },
            "misc": {
                "name": "test 1",
                "symbol": "TEST"
            }
        }

        const result = await chai.request(server).post("/nft/add").send(obj)
        console.log(result.text)
        result.should.have.property("text")
    })

})
