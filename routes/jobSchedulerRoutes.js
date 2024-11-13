import { Router } from "express";
const router = Router();
import { createJobScheduler,sendNotification } from "../controllers/jobScheduleController.js";

router.route("/create").post(createJobScheduler);

router.route("/send/notification").post(sendNotification);

export default router;
