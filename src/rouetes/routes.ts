import express from "express";
import {
  getByData,
  addNFT,
  getByURI,
  fileAdder,
  testRoute,
  cacheNft
} from "../controllers/controller";

const router = express.Router();

router.get("/uri", getByURI);
router.get("/data", getByData);
router.post("/add", cacheNft);
router.post("/file", fileAdder);
router.get("/test", testRoute);

export default router;
