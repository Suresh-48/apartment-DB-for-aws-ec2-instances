import { Router } from "express";

const router = Router();

import {getCustomerList, updateCustomerStatus} from "../controllers/adminController.js";


router.route("/get/customer/list").get(getCustomerList);
router.route("/update/customer/status/:id").patch(updateCustomerStatus);

export default router;


