import { Router } from "express";
const router = Router();

import {
    createVehicleDetails,
    deleteVehicleDetailsById,
    getAllVehicleDetails,
    getVehicleDetailsById,
    updateVehicleDetailsById,
    getUserByVehicleNumber
} from "../controllers/vehiclDetailsController.js";

router.route("/create").post(createVehicleDetails);
router.route("/update/:id").put(updateVehicleDetailsById);
router.route("/get/all/:id").get(getAllVehicleDetails);
router.route("/get/by/register/number").get(getUserByVehicleNumber);
router.route("/get/:id").get(getVehicleDetailsById);
router.route("/delete/:id").delete(deleteVehicleDetailsById);

export default router;