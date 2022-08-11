import express from "express";
import {
  getByData,
  addNFT,
  getByURI,
  fileAdder,
  testRoute,
  cacheNft,
} from "../controllers/controller";
import { prepareObject, parseNft } from "../middleware";

const router = express.Router();

router.get("/uri", getByURI);
router.get("/data", getByData);
router.post("/add", parseNft, prepareObject, cacheNft);
//router.post("/file", fileAdder);
//router.post("/test", testRoute);

export default router;
