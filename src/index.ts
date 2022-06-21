import express from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import router from "./rouetes/routes";
import { mongoURL } from "./helpers/consts";

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

const app = express();

app.use(express.json());
app.use(cors());

/*const corsOptions = {
    origin: (origin:any, callback:any) => {
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Access-Control-Allow-Origin", "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    credentials: true
  };*/

//app.options('*', cors(corsOptions))
//app.use(cors(corsOptions))

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

export default app.listen(port, () => {
  console.log(`Server runs on port ${port}`);
});

mongoose.connect(URL, options);
const connection = mongoose.connection;
connection.on("error", (err) => console.error("connection error: ", err));
connection.once("open", () => console.log("connected to: ", connection.name));
