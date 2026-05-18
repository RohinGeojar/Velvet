import express from "express"
import { addProduct, loadAddProducts, loadProducts } from "../../controllers/admin/productController.js"
import { createUploader } from "../../middleware/multer.js"

const router = express.Router()

const uploadProduct = createUploader("products",5)

router.get("/",loadProducts)

router.get("/add",loadAddProducts)
router.post("/add",uploadProduct.any(),addProduct)

// router.get("edit",loadEditProduct)
// router.patch("edit/:id",editProduct)

// router.patch("/block",blockProduct)
// router.patch("/unblock",unBlockProduct)

export default router