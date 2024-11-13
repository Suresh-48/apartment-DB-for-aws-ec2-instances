import { Router } from "express";
const router = Router();
import { verifyAllToken, onlyAdmin } from "../utils/tokenAuthentication.js";
import { getSocietyDues, getAssociationDetailReport, getMembersReport } from "../controllers/reportController.js";

router.route("/get/due").post(verifyAllToken, onlyAdmin, getSocietyDues);
router.route("/get/association/details").post(verifyAllToken, onlyAdmin, getAssociationDetailReport);
router.route("/get/user").get(verifyAllToken, onlyAdmin, getMembersReport);

export default router;