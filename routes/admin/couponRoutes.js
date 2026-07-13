import express from "express"
import { isLoggin } from "../../middleware/admin/authMiddilware.js"
import { createCoupon, loadCouponManagement, loadCreateCoupon, loadEditCoupon } from "../../controllers/admin/couponController.js"

const router = express.Router()

router.get("/",isLoggin,loadCouponManagement)

router.get("/create",isLoggin,loadCreateCoupon)
router.post("/create",isLoggin,createCoupon)

router.get("/edit/",isLoggin,loadEditCoupon)


export default router