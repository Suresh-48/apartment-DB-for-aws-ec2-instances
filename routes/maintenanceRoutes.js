import { Router } from "express";
const router = Router();

import {
    createMaintenance,
    deleteMaintenanceById,
    getAllMaintenance,
    getMaintenanceById,
    updateMaintenanceById
} from "../controllers/maintenanceController.js";
import { verifyAllToken } from "../utils/tokenAuthentication.js";

router.route("/create").post(verifyAllToken, createMaintenance);
router.route("/update/:id").put(verifyAllToken, updateMaintenanceById);
router.route("/get/all").get(verifyAllToken, getAllMaintenance);
router.route("/get/:id").get(verifyAllToken, getMaintenanceById);
router.route("/delete/:id").delete(verifyAllToken, deleteMaintenanceById);

export default router;
