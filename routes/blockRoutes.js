import { Router } from "express";
const router = Router();

import {
  createBlocks,
  getAllBlockandFlats,
  createMultipleBlocks,
  getAllBlocks,
  deleteBlocks,
  getAllBlockList
} from "../controllers/blockController.js";
import { verifyStaticToken } from "../utils/tokenAuthentication.js";

router.route("/create").post(createBlocks);
router.route("/list").get(getAllBlockandFlats);
router.route("/get/all").get(getAllBlocks);
router.route("/list/get/all").get(getAllBlockList);
router.route("/insert/many").post(createMultipleBlocks);
router.route("/delete/:id").delete(deleteBlocks);

export default router;
