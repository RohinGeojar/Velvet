import express from 'express';
import { loadForgotPassword, loadHome, loadLogin, loadRegister, loadResetPassword, login, logout, resetPassword, sendForgotOtp, signup, verifyForgotOtp, verifyOtp } from '../../controllers/user/authController.js';



const router = express.Router()


router.get("/", loadHome);

router.get("/register", loadRegister);
router.post("/register", signup);
router.post("/verifyOtp", verifyOtp)

router.get("/login", loadLogin);
router.post("/login", login);

router.get("/forgotPassword", loadForgotPassword);
router.post("/forgotPassword", sendForgotOtp);
router.post("/verifyForgotOtp", verifyForgotOtp);

router.get("/resetPassword", loadResetPassword);
router.post("/resetPassword", resetPassword);


router.get("/logout",logout)

export default router;