import express from 'express'
import {config} from 'dotenv'
import mongoose from "mongoose";

import router from './routes'
import { mongoURL } from "./helpers/consts";

config()
const port = process.env.PORT || 3030;
const URL: string = mongoURL || ""

const options: any = {
    //useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
//TO DELETE ON PROD!!!!!!
const testurl: string = "mongodb://localhost:27017/test"

const app = express()

app.use(express.json())
app.use("/nft", router)

mongoose.connect(testurl, options);
const connection = mongoose.connection;
connection.on('error', err => console.error('connection error: ', err));
connection.once('open', () => console.log('connected to: ', connection.name))




export default app.listen(port, () => {
    console.log(`Server runs on port ${port}`)
})