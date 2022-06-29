import express from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import router from "./rouetes/routes";
import { mongoURL } from "./helpers/consts";

import cluster from "cluster";

config();
const port = process.env.PORT || 3030;
const URL: string = mongoURL || "";

const options: any = {
  //useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
//TO DELETE ON PROD!!!!!!
//const testurl: string = "mongodb://localhost:27017/test"

if (cluster.isPrimary) {
  for (let i = 0; i < 5; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log("Let's fork another worker!");
    cluster.fork();
  });
} else {
  setTimeout(() => {
    mongoose.connect(URL, options);
    const connection = mongoose.connection;
    connection.on("error", (err) => console.error("connection error: ", err));
    connection.once("open", () =>
      console.log("connected to: ", connection.name)
    );
  }, Math.random() * 1000);

  const app = express();

  app.use(express.json());
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

  app.listen(port, () => {
    console.log(`Server runs on port ${port}`);
  });
}
