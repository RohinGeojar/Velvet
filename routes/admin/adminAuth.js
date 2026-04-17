import express from 'express';
import { adminLogin, loadAdminLogin, loadDashBoard, logout } from '../../controllers/admin/authController.js';
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

export default router;