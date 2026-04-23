import express from "express";
import { changePassword, loadOverview, loadProfile, resendEmailOtp, updateProfile, uploadProfilePhoto, verifyEmailChange} from "../../controllers/user/profileController.js";
import {  userAuth } from '../../middleware/auth.js';
import { upload } from "../../config/multer.js";
import { changePasswordSchema, profileUpdateSchema } from "../../validators/profileValidator.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

router.get("/", userAuth, loadProfile);
router.get("/overview",userAuth, loadOverview)
router.post("/", userAuth, validate(profileUpdateSchema), updateProfile);

router.post("/changePassword", userAuth,validate(changePasswordSchema), changePassword);

router.post("/resendEmailOtp",userAuth, resendEmailOtp);
router.post("/verifyEmailChange",userAuth, verifyEmailChange);

router.post("/uploadPhoto", userAuth,upload.single("profileImage"), uploadProfilePhoto);

export default router;