import express from "express";
import { changePassword, loadProfile, updateProfile, uploadProfilePhoto} from "../../controllers/user/profileController.js";
import {  userAuth } from '../../middleware/auth.js';
import { upload } from "../../config/multer.js";
import { changePasswordSchema, profileUpdateSchema } from "../../validators/profileValidator.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

router.get("/", userAuth, loadProfile);
router.post("/", userAuth, validate(profileUpdateSchema), updateProfile);
router.post("/changePassword", userAuth,validate(changePasswordSchema), changePassword);

router.post("/uploadPhoto", upload.single("profileImage"), uploadProfilePhoto);

export default router;