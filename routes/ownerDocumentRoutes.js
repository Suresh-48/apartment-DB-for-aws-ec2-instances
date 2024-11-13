import Router from "express";
const router = Router();
import {
  updateDocumentStatus,
  getUserDocumentPendingList,
  getOwnerDocumentList,
  getAllMemberList,
  getPendingCount
} from "../controllers/ownerDocumentController.js";

router.route("/update/document/status/:id").patch(updateDocumentStatus);

router.route("/pending/count").get(getPendingCount);
router.route("/pending/document/list").get(getUserDocumentPendingList);

router.route("/member/list").get(getAllMemberList);

router.route("/profile/doc/list/:id").get(getOwnerDocumentList);

export default router;
