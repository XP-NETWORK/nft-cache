import express from 'express'
import * as mongoose from 'mongoose'
import router from './routes'
require('dotenv').config();
//import middleware from './serverMiddleware'
//import { MONGO_URI, PORT } from './config/keys'
import NFT from './models/nft'

require('./db')
const port = process.env.PORT || 3030;

const app = express()

app.use(express.json())
app.use("/nft", router)

export default app.listen(port, () => {
    console.log(`Server runs on port ${port}`)
})