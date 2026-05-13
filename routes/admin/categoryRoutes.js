import { addCategory, blockCategory, categoryRefreshStat, deleteCategory, editCategory, loadAddCategory, loadCategory, loadEditCategory, restoreCategory, searchCategory, unblockCategory} from "../../controllers/admin/categoryController.js"
import express from 'express';
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createUploader } from "../../middleware/multer.js";

const router = express.Router()

const uploadCategory = createUploader("categories",2)
router.get("/",loadCategory)

router.get("/add",asyncHandler(loadAddCategory))
router.post("/add", uploadCategory.single("image"),addCategory)
router.get("/edit/:id",asyncHandler(loadEditCategory))
router.post("/edit/:id",uploadCategory.single("image"),editCategory)



router.patch("/block/:id",blockCategory)
router.patch("/unblock/:id",unblockCategory)

router.get("/search",searchCategory)
router.patch("/delete/:id",deleteCategory)
router.patch("/restore/:id", restoreCategory)

router.get("/stats", categoryRefreshStat)


export default router