import express from "express"
import { addProduct, blockProduct, deleteProduct, loadAddProducts, loadEditProducts, loadProducts, restoreProduct, searchProducts, unBlockProduct, updateProduct } from "../../controllers/admin/productController.js"
import { createUploader } from "../../middleware/multer.js"
import { isLoggin } from "../../middleware/admin/authMiddilware.js"

const router = express.Router()

const uploadProduct = createUploader("products", 5)

router.get("/", isLoggin, loadProducts)

router.get("/add",isLoggin, loadAddProducts)
router.post("/add",isLoggin, uploadProduct.any(), addProduct)

router.get("/edit/:id", isLoggin,loadEditProducts)
router.post("/edit/:id",isLoggin,uploadProduct.any(),updateProduct)


router.patch("/block/:id",isLoggin,blockProduct)
router.patch("/unblock/:id",isLoggin,unBlockProduct)

router.patch("/delete/:id",isLoggin,deleteProduct)
router.patch("/restore/:id",isLoggin,restoreProduct)
router.get("/search", isLoggin,searchProducts);

export default router