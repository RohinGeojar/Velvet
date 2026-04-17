import express from 'express';
import {  loadForgotPassword, loadHome, loadLogin, loadRegister, loadResetPassword, login, logout, resetPassword, sendForgotOtp, signup, verifyForgotOtp, verifyOtp } from '../../controllers/user/authController.js';
import { googleAuth, googleAuthCallback, isLogged, userAuth } from '../../middleware/auth.js';
import { loginSchema, signupSchema } from '../../validators/authValidator.js';
import { validate } from "../../middleware/validate.js";


const router = express.Router()

router.use((req, res, next) => {
  res.locals.layout = "partials/user/layout";
  next();
});
router.get("/", loadHome);

router.get("/register",isLogged, loadRegister);
router.post("/register",validate(signupSchema), signup);
router.post("/verifyOtp", verifyOtp)

router.get("/login", isLogged,  loadLogin);
router.post("/login",validate(loginSchema), login);

router.get("/auth/google",googleAuth)
router.get("/auth/google/callback",googleAuthCallback)

router.get("/forgotPassword", loadForgotPassword);
router.post("/forgotPassword", sendForgotOtp);
router.post("/verifyForgotOtp", verifyForgotOtp);

router.get("/resetPassword",loadResetPassword);
router.post("/resetPassword", resetPassword);




router.get("/logout",logout)

export default router;