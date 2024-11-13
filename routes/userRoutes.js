import { Router } from "express";
const router = Router();

import {
  signup,
  validateOtp,
  createUserCredential,
  userLogin,
  getUserDetails,
  updateOwnerProfile,
  updateUserStatus,
  getPendingUsers,
  userAdminLogin,
  resendOtp,
  getUserData,
  getSingleUserDetails,
  deactivateUser,
  getAllMembersList,
  changePassword,
  getProfile,
  signoutUser,
  forgotPassword,
  createStaff,
  deleteStaff,
  getAllStaff
} from "../controllers/userController.js";

import { verifyAllToken, onlyAdmin } from "../utils/tokenAuthentication.js";

router.route("/signup").post(signup);

router.route("/staff/create").post(verifyAllToken, onlyAdmin, createStaff);

router.route("/staff/get/all").get(verifyAllToken, onlyAdmin, getAllStaff);

router.route("/staff/delete/:id").delete(verifyAllToken, onlyAdmin, deleteStaff);

router.route("/signout").post(verifyAllToken, signoutUser);

router.route("/validate/otp").patch(validateOtp);

router.route("/resend/otp").post(resendOtp);

router.route("/set/password").patch(createUserCredential);

router.route("/forgot/password").post(forgotPassword);

router.route("/change/password").post(verifyAllToken, changePassword);

router.route("/login").post(userLogin);

router.route("/profile").get(verifyAllToken, getProfile);

router.route("/:id").get(getUserDetails);

router.route("/details/:id").get(getSingleUserDetails);

router.route("/get/user/info/:id").get(getUserData);

router.route("/update/owner/profile").put(updateOwnerProfile);

router.route("/get/pending/users").get(getPendingUsers);

router.route("/update/status/:id").patch(updateUserStatus);

router.route("/admin/login").post(userAdminLogin);

router.route("/deactivate/:id").put(deactivateUser);

router.route("/all/members/list").get(getAllMembersList);




export default router;
