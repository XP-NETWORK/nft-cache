import request from 'supertest'
import chai, { expect } from 'chai'
import server from '../src/index'
import chaiHttp from 'chai-http'
import console from 'console'

const should = chai.should()

chai.use(chaiHttp)


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


        const res = await chai.request(server).get(`/nft/uri?uri=${result.body.uri}`)/*.end((err, res) => {
            if (err) {
                console.log("moo: ", err)
                return
            }
            console.log("this is response: ", res.body)
            res.status.should.eq(200)
            res.body.should.have.property("image")

        })*/
        console.log("something is: ", res)
        res.status.should.eq(200)
        res.body.should.have.property("image")

    })

    it("test 2 - no url given",async ()=>{
        const res = await chai.request(server).get(`/nft/uri?uri=abc`)
        console.log("res is: ",res)
        res.status.should.eq(401)
        res.text.should.be("no url given")
    })

    it("test 3 - try to get a non-existing nft", async ()=>{
        const res = await chai.request(server).get(`/nft/uri?uri=abc`)
        console.log("something is: ", res)
        res.status.should.eq(200)
        res.text.should.be("no such NFT found")
        
    })

})

describe("GET getByData",()=>{

    

})
