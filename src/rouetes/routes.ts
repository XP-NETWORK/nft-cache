import express from "express";

import { getByData } from "../controllers/getByData";

import { getByURI } from "../controllers/getByUri";

import { addNft } from "../controllers/addNft";

import { testRoute } from "../controllers/addCollection";

const router = express.Router();

router.get("/uri", getByURI);
router.get("/data", getByData);
router.post("/add", addNft);

router.post("/test", testRoute);

export default router;
