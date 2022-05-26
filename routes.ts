import express from 'express'
import {test,getByData, addNFT, show, getByURI} from './controller'

const router=express.Router()

router.get("/test",show)
router.get("/url",getByURI)
router.get("/token",getByData)
router.post("/add",addNFT)


export default router