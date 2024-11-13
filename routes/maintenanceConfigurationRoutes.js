import { Router } from "express";
const router = Router();

import {
    createMaintenanceConfiguration, getMaintenanceConfiguration, mailForUnpaidUser, sendBulkMail, getMaintenanceConfigurationByMonthYear, updatePaymentStatus, getMaintenanceConfigurationByYear,
    getMaintenanceWithFlats
} from "../controllers/maintenanceConfigurationController.js";
import { verifyAllToken, onlyAdmin } from '../utils/tokenAuthentication.js'

router.route("/create").post(verifyAllToken, onlyAdmin, createMaintenanceConfiguration);
router.route("/flats/get").get(verifyAllToken, getMaintenanceWithFlats);
router.route("/get").get(verifyAllToken, getMaintenanceConfiguration);
router.route("/update/payment/status/:id").put(verifyAllToken, onlyAdmin, updatePaymentStatus);
router.route("/send/mail").post(verifyAllToken, onlyAdmin, mailForUnpaidUser);
router.route("/send/bulk/mail").post(verifyAllToken, onlyAdmin, sendBulkMail);
router.route("/get/by/month").post(verifyAllToken, onlyAdmin, getMaintenanceConfigurationByMonthYear);
router.route("/get/by/year").post(verifyAllToken, getMaintenanceConfigurationByYear);

export default router;
