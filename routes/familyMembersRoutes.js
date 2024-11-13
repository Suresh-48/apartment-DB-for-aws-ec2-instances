import { Router } from "express";
const router = Router();

import {
  createFamilyMember,
  deleteFamilyMemberById,
  getAllFamilyMembers,
  getFamilyMemberById,
  updateFamilyMemberById
} from "../controllers/familyMembersController.js";

import { verifyAllToken, onlyAdmin } from '../utils/tokenAuthentication.js'

router.route("/create").post(verifyAllToken, createFamilyMember);
router.route("/update/:id").put(verifyAllToken, updateFamilyMemberById);
router.route("/get/all/:id").get(verifyAllToken, getAllFamilyMembers);
router.route("/get/:id").get(verifyAllToken, getFamilyMemberById);
router.route("/delete/:id").delete(verifyAllToken, deleteFamilyMemberById);

export default router;
