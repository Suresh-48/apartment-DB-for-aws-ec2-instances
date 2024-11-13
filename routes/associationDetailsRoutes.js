import { Router } from "express";
const router = Router();
import { verifyAllToken, onlyAdmin } from "../utils/tokenAuthentication.js";
import {
    createInitialAmount,
    getAssociationAmount,
    createDetails,
    getAssociationDetails,
    updateAmount,
    getAssociationDetailsForMember,
    updatePettyCashLimit
} from "../controllers/associationDetailsController.js";

router.route("/amount/create").post(verifyAllToken, onlyAdmin, createInitialAmount);
router.route("/amount/update").post(verifyAllToken, onlyAdmin, updateAmount);
router.route("/create").post(verifyAllToken, onlyAdmin, createDetails);
router.route("/get").get(verifyAllToken, onlyAdmin, getAssociationDetails);
router.route("/member/get").get(verifyAllToken, getAssociationDetailsForMember);
router.route("/amount/get").get(verifyAllToken, onlyAdmin, getAssociationAmount);
router.route("/amount/update/:id").put(verifyAllToken, onlyAdmin, updatePettyCashLimit);

export default router;