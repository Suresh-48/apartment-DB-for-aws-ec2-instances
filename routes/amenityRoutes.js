import { Router } from "express";
const router = Router();
import {
    createAmenity, deleteAmenity, updateAmenity, getAllAmenity, getAllAmenityById, getAllAmenityForMember
} from "../controllers/amenityController.js";
import { verifyAllToken, onlyAdmin } from "../utils/tokenAuthentication.js";

router.route("/create").post(verifyAllToken, onlyAdmin, createAmenity);
router.route("/get/by/user").get(verifyAllToken, getAllAmenityForMember);
router.route("/get").get(verifyAllToken, onlyAdmin, getAllAmenity);
router.route("/get/:id").get(verifyAllToken, getAllAmenityById);
router.route("/update/:id").put(verifyAllToken, onlyAdmin, updateAmenity);
router.route("/delete/:id").delete(verifyAllToken, onlyAdmin, deleteAmenity);

export default router;