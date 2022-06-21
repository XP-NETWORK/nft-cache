import express from "express";
import {
  getByData,
  addNFT,
  getByURI,
  fileAdder,
  testRoute,
} from "../controllers/controller";

const router = express.Router();

router.get("/uri", getByURI);
router.get("/data", getByData);
router.post("/add", addNFT);
router.post("/file", fileAdder);
router.get("/test", testRoute);

export default router;
