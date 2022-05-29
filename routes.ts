import express from 'express'
import {getByData, addNFT, getByURI, deleteObjects} from './controller'

const router=express.Router()

router.get("/uri",getByURI)
router.get("/data",getByData)
router.post("/add",addNFT)
router.delete("/delete",deleteObjects)

export default router