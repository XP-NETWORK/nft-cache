import mongoose from "mongoose";
require('dotenv').config();
const URL: string  = process.env.URL||""

const options:any = {
    //useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

const testurl:string = "mongodb://localhost:27017/test"

mongoose.connect(testurl, options);
const connection = mongoose.connection;
connection.on('error', err => console.error('connection error: ', err));
connection.once('open', () => console.log('connected to: ', connection.name))