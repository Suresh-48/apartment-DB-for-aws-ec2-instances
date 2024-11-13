import { Router } from "express";
const router = Router();

import {
    createMaintenanceCalc, getAllMaintanance, updateMaintenanceCalc, getTotalAmountByExpenseType, removeMaintenanceCalc
} from "../controllers/maintenanceCalculationController.js";
import { verifyAllToken, onlyAdmin } from '../utils/tokenAuthentication.js'

router.route("/create").post(verifyAllToken, onlyAdmin, createMaintenanceCalc);
router.route("/update/:id").put(verifyAllToken, onlyAdmin, updateMaintenanceCalc);
router.route("/remove/:id").put(verifyAllToken, onlyAdmin, removeMaintenanceCalc);
router.route("/get").get(verifyAllToken, onlyAdmin, getAllMaintanance);
router.route("/get/expense/amount").get(verifyAllToken, onlyAdmin, getTotalAmountByExpenseType);

export default router;
