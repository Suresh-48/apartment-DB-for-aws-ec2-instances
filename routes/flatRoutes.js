import { Router } from "express";
const router = Router();

import {
  createFlat,
  getAllFlat,
  createMultipleFlats,
  getBlockFlatList,
  deleteFlats,
  getAllFlatList,
  getEntireByFlats,
  getApartmentSquareFeet,
  getAllSquareFeetbyFlat,
  getPaymentDetails
} from "../controllers/flatController.js";
import { verifyToken, verifyAllToken, onlyAdmin, verifyStaticToken } from '../utils/tokenAuthentication.js'

router.route("/create").post(createFlat);
router.route("/get/all").get(getAllFlat);

router.route("/get/squarefeet/list").get(verifyAllToken, getAllSquareFeetbyFlat);

router.route("/squarefeet").get(verifyAllToken, onlyAdmin, getApartmentSquareFeet);
router.route("/payment/details").get(verifyAllToken, getPaymentDetails);

router.route("/list/get/all").get(getAllFlatList);
router.route("/get/entire/details/by/flat").get(verifyAllToken, onlyAdmin, getEntireByFlats);
router.route("/get/block/flat/list").post(getBlockFlatList);
router.route("/insert/many").post(createMultipleFlats);
router.route("/delete/:id").delete(deleteFlats)

export default router;
