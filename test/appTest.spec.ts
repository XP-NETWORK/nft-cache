import request from 'supertest'
import chai,{expect} from 'chai'
import server from '../src/index'
import chaiHttp from 'chai-http'

const should = chai.should()

chai.use(chaiHttp)


describe("server boot test",()=>{
    it("server is created without error",function(){
        console.log("hello")
    })
})


describe("GET data")
