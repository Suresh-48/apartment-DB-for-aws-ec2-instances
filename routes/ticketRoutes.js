import { Router } from "express";
const router = Router();
import {
  createTicket,
  getTicketListForAdmin,
  getTicketListByUser,
  updateStatus,
  updateTicketFiles,
  deleteTicketDocument,
} from "../controllers/ticketController.js";
import {
  verifyToken,
  verifyAllToken,
  onlyAdmin,
} from "../utils/tokenAuthentication.js";

router.route("/create").post(createTicket);
router.route("/update/status/:id").put(updateStatus);
router.route("/update/files/:id").put(updateTicketFiles);
router.route("/delete/files/:id").delete(deleteTicketDocument);
router.route("/get/all/:id").get(getTicketListForAdmin);
router.route("/get/all/by/user/:id").get(getTicketListByUser);
// router.route("/get/:id").get(getPetsById);
// router.route("/delete/:id").delete(deletePetsById);

export default router;
