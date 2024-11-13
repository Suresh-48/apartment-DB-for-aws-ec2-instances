import { Router } from "express";
const router = Router();
import multer from "multer";

import { createNotification, getNotification } from "../controllers/notificationController.js";
import { verifyAllToken, onlyAdmin } from "../utils/tokenAuthentication.js";

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        cb(null, true);
    },
});

router.route("/create").post(verifyAllToken, onlyAdmin, upload.single('attachment'), createNotification);
router.route("/get").get(verifyAllToken, onlyAdmin, getNotification);

export default router;
