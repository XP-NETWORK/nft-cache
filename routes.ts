import express from 'express'
import {getByData, addNFT, getByURI, deleteObjects} from './controller'

const router=express.Router()

router.get("/uri",getByURI)
router.get("/data",getByData)
router.post("/add",addNFT)


export default router