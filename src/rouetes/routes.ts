import express from 'express'
import {getByData, addNFT, getByURI,fileAdder} from '../controllers/controller'

const router = express.Router()

router.get("/uri",getByURI)
router.get("/data",getByData)
router.post("/add",addNFT)
router.post("/file",fileAdder)


export default router