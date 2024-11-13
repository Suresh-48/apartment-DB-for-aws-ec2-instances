import { Router } from "express";
const router = Router();

import {
    createPets,
    deletePetsById,
    getAllPets,
    getPetsById,
    updatePetsById
} from "../controllers/petsController.js";

router.route("/create").post(createPets);
router.route("/update/:id").put(updatePetsById);
router.route("/get/all/:id").get(getAllPets);
router.route("/get/:id").get(getPetsById);
router.route("/delete/:id").delete(deletePetsById);

export default router;
