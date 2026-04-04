import express from "express";
import { changePassword, loadProfile, updateProfile} from "../../controllers/user/profileController.js";
import {  userAuth } from '../../middleware/auth.js';

const router = express.Router();

router.get("/", userAuth, loadProfile);
router.post("/", userAuth, updateProfile);
router.post("/changePassword", userAuth, changePassword);

export default router;