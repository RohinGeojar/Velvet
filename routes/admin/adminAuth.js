import express from 'express';
import { adminLogin, loadAdminForgot, loadAdminLogin, loadAdminReset, loadDashBoard, logout, resetAdminPassword, sendAdminOtp, verifyAdminOtp } from '../../controllers/admin/authController.js';
import { checkLoggedIn, isLoggin } from '../../middleware/admin/authMiddilware.js';

const router = express.Router()

router.use((req, res, next) => {
    if (req.path.includes("login")) {
      return next();
    }
  res.locals.layout ="partials/admin/adminLayout";


  const path = req.path;

  if (path.includes("dashboard")) {
    res.locals.activeNavLink = "Dashboard";
  } else if (path.includes("users")) {
    res.locals.activeNavLink = "Users";
  } else {
    res.locals.activeNavLink = "";
  }

  next();
});

router.get("/login",checkLoggedIn,loadAdminLogin)
router.post("/login",adminLogin)
router.get("/dashboard",isLoggin, loadDashBoard)
router.get("/logout",logout)


router.get("/forgotPassword", loadAdminForgot);
 router.post("/forgotPassword", sendAdminOtp);

 router.post("/verifyAdminOtp", verifyAdminOtp);

 router.get("/resetPassword", loadAdminReset);
 router.post("/resetPassword", resetAdminPassword);

export default router;