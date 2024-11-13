import { Router } from "express";
const router = Router();
import { verifyAllToken } from "../utils/tokenAuthentication.js";
import { createPosition, getPositionList, updateUserToPosition } from "../controllers/positionController.js";

router.route("/create").post(createPosition);
router.route("/update/:id").put(updateUserToPosition);
router.route("/get").get(getPositionList);

export default router;