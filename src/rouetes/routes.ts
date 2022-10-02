import express from "express";

import { getByData } from "../controllers/getByData";

import { getByURI } from "../controllers/getByUri";

import { addNft } from "../controllers/addNft";

import {
  testRoute,
  uploadCollection,
  uploadTezos,
} from "../controllers/addCollection";

import { parseNft } from "../controllers/parseNft";

const router = express.Router();

router.get("/uri", getByURI);
router.get("/data", getByData);
router.post("/add", addNft);
router.post("/parse", parseNft);
//router.post("/test", testRoute);
//router.post("/test1", uploadCollection);
//router.post("/test2", uploadTezos);

export default router;
