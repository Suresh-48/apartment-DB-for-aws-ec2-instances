import { Router } from "express";
const router = Router();
import { verifyAllToken, onlyAdmin } from "../utils/tokenAuthentication.js";
import { createAssociation, updateAssociation, getAssociation } from "../controllers/associationController.js";

router.route("/create").post(verifyAllToken, onlyAdmin, createAssociation);
router.route("/update/:id").put(verifyAllToken, onlyAdmin, updateAssociation);
router.route("/get").get(verifyAllToken, onlyAdmin, getAssociation);

export default router;