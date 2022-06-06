import express from 'express'
import {config} from 'dotenv'
import mongoose from "mongoose";

import router from './rouetes/routes'
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


const app = express()

app.use(express.json())
app.use("/nft", router)


app.use('/', express.static('./public'));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, token");
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});


export default app.listen(port, () => {
    console.log(`Server runs on port ${port}`)
})


mongoose.connect(URL, options);
const connection = mongoose.connection;
connection.on('error', err => console.error('connection error: ', err));
connection.once('open', () => console.log('connected to: ', connection.name))
