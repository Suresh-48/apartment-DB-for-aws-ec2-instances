import { Router } from "express";

const router = Router();

import { addProduct, deleteProduct, getProduct, updateProduct, getProductById } from "../controllers/productWarrantyController.js";
import { verifyAllToken, onlyAdmin } from "../utils/tokenAuthentication.js";

router.route("/create").post(verifyAllToken, onlyAdmin, addProduct);
router.route("/get").get(verifyAllToken, onlyAdmin, getProduct);
router.route("/get/:id").get(verifyAllToken, onlyAdmin, getProductById);
router.route("/update/:id").put(verifyAllToken, onlyAdmin, updateProduct);
router.route("/delete/:id").delete(verifyAllToken, onlyAdmin, deleteProduct);

export default router;