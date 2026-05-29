import express from "express";
import {
  loadUsers,
  blockUser,
  unblockUser,
  searchUsers,
  refreshStat
} from "../../controllers/admin/userController.js";
import { isLoggin } from "../../middleware/admin/authMiddilware.js";

// import { adminAuth } from "../../middleware/adminAuth.js";

const router = express.Router();

router.use((req, res, next) => {
  res.locals.layout = "partials/admin/adminLayout";
  next();
});

router.get("/users",isLoggin,  loadUsers);
router.get("/users/search",isLoggin, searchUsers);
router.get("/user-stats",isLoggin, refreshStat)

router.patch("/block-user/:id",isLoggin, blockUser);
router.patch("/unblock-user/:id",isLoggin, unblockUser);
export default router;