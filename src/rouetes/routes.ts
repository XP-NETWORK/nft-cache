import express from 'express'
import {getByData, addNFT, getByURI,fileAdder,deleteObjects} from '../controllers/controller'

const router = express.Router()

router.get("/uri",getByURI)
router.get("/data",getByData)
router.post("/add",addNFT)
router.post("/file",fileAdder)
router.delete("/delete",deleteObjects)

export default router