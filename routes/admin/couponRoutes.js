import express from "express"
import { isLoggin } from "../../middleware/admin/authMiddilware.js"
import { createCoupon, deleteCoupon, loadCouponManagement, loadCreateCoupon, loadEditCoupon, loadOfferManagement, restoreCoupon, toggleCoupon, updateCoupon } from "../../controllers/admin/couponController.js"

const router = express.Router()

router.get("/",isLoggin,loadCouponManagement)

router.get("/create",isLoggin,loadCreateCoupon)
router.post("/create",isLoggin,createCoupon)

router.get("/edit/:id", isLoggin, loadEditCoupon)
 router.post("/edit/:id", isLoggin, updateCoupon)

router.patch("/toggle/:id", isLoggin, toggleCoupon)

router.delete("/delete/:id", isLoggin, deleteCoupon)
router.patch("/restore/:id", isLoggin, restoreCoupon);


router.get("/offers",isLoggin,loadOfferManagement)

export default router