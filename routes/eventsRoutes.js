import { Router } from "express";
const router = Router();
import {
    createEvents, getEvent, deleteEvent, updateEvent, getAllEvent
} from "../controllers/eventController.js";
import { verifyAllToken, onlyAdmin } from "../utils/tokenAuthentication.js";

router.route("/create").post(verifyAllToken, onlyAdmin, createEvents);
router.route("/get/all").get(verifyAllToken, getAllEvent);
router.route("/get").get(verifyAllToken, getEvent);
router.route("/update/:id").put(verifyAllToken, updateEvent);
router.route("/delete/:id").delete(verifyAllToken, deleteEvent);

export default router;
