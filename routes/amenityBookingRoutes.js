import { Router } from "express";
const router = Router();
import {
    createAmenityBooking, deleteAmenityBooking, getAllAmenityBooking,
    getBookingDatesWithAmenity, updateAmenityBooking, validationForAmenityBooking,
    getBookingDates
} from "../controllers/amenityBookingController.js";
import { verifyAllToken, onlyAdmin } from "../utils/tokenAuthentication.js";

router.route("/create").post(verifyAllToken, createAmenityBooking);
router.route("/create/validation").post(verifyAllToken, validationForAmenityBooking);
router.route("/get").get(verifyAllToken, getAllAmenityBooking);
router.route("/get/booked/dates/:id").get(verifyAllToken, onlyAdmin, getBookingDates);
router.route("/get/:id").get(verifyAllToken, getBookingDatesWithAmenity);
router.route("/update/:id").put(verifyAllToken, onlyAdmin, updateAmenityBooking);
router.route("/delete/:id").delete(verifyAllToken, onlyAdmin, deleteAmenityBooking);

export default router;