import { Router } from "express";
import multer from 'multer'
const router = Router();

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

import {
    createRental
} from "../controllers/rentalController.js";

router.post("/create", upload.fields([{ name: 'addressProof' }, { name: 'photo' }]), createRental);

// router.post("/create").post(createRental);

export default router;
