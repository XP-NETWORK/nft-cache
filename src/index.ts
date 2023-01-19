import express from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import router from "./rouetes/routes";
import { mongoURL } from "./helpers/consts";

config();
const port = process.env.PORT || 3030;
const URL: string = mongoURL || "";

export const mongo_options: any = {
  //useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
//TO DELETE ON PROD!!!!!!
//const testurl: string = "mongodb://localhost:27017/test"

//export const instance = new mongoose.Mongoose();

//instance.connect(URL, mongo_options);

mongoose.connect(URL, mongo_options);
const connection = mongoose.connection;
connection.on("error", (err) => console.error("connection error: ", err));
connection.once("open", () => console.log("connected to: ", connection.name));

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb" }));

app.use(cors());

app.use("/", express.static("./public"));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, token"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

app.use("/nft", router);

app.listen(port, async () => {
  console.log(`Server runs on port ${port}`);
});
