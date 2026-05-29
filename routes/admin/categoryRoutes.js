import { addCategory, blockCategory, categoryRefreshStat, deleteCategory, editCategory, loadAddCategory, loadCategory, loadEditCategory, restoreCategory, searchCategory, unblockCategory} from "../../controllers/admin/categoryController.js"
import express from 'express';
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createUploader } from "../../middleware/multer.js";
import { isLoggin } from "../../middleware/admin/authMiddilware.js";

const router = express.Router()

const uploadCategory = createUploader("categories",2)
router.get("/",isLoggin,loadCategory)

router.get("/add",isLoggin,asyncHandler(loadAddCategory))
router.post("/add",isLoggin, uploadCategory.single("image"),addCategory)
router.get("/edit/:id",isLoggin,asyncHandler(loadEditCategory))
router.post("/edit/:id",isLoggin,uploadCategory.single("image"),editCategory)



router.patch("/block/:id",isLoggin,blockCategory)
router.patch("/unblock/:id",isLoggin,unblockCategory)

router.get("/search",isLoggin,searchCategory)
router.patch("/delete/:id",isLoggin,deleteCategory)
router.patch("/restore/:id",isLoggin, restoreCategory)

router.get("/stats", isLoggin,categoryRefreshStat)


export default router