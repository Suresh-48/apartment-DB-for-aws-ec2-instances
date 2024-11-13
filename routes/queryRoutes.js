import { Router } from "express";
const router = Router();
import {
  createQuery,
  getQueryListForAdmin,
  updateStatus,
  updateResponseForQuery,
  reopenStatus,
  getAllMessageById,
  getAllQueryAndMessageByUser
} from "../controllers/queryController.js";
import {
  verifyToken,
  verifyAllToken,
  onlyAdmin,
} from "../utils/tokenAuthentication.js";

router.route("/create").post(verifyAllToken, createQuery);
router.route("/update/response/:id").put(verifyAllToken, updateResponseForQuery);
router.route("/update/status/:id").put(verifyAllToken, updateStatus);
router.route("/status/reopen/:id").put(verifyAllToken, reopenStatus);
router.route("/get/all/message").get(verifyAllToken, getAllQueryAndMessageByUser);
router.route("/get/all").get(getQueryListForAdmin);

export default router;
