import express from "express"
import { isLoggin } from "../../middleware/admin/authMiddilware.js"
import { createCoupon, createOffer, deleteCoupon, loadCouponManagement, loadCreateCoupon, loadCreateOffer, loadEditCoupon, loadEditOffer, loadOfferManagement, restoreCoupon, toggleCoupon, updateCoupon } from "../../controllers/admin/couponController.js"

const router = express.Router()

router.get("/",isLoggin,loadCouponManagement)

router.get("/create",isLoggin,loadCreateCoupon)
router.post("/create",isLoggin,createCoupon)

router.get("/edit/:id", isLoggin, loadEditCoupon)
 router.post("/edit/:id", isLoggin, updateCoupon)

router.patch("/toggle/:id", isLoggin, toggleCoupon)

router.delete("/delete/:id", isLoggin, deleteCoupon)
router.patch("/restore/:id", isLoggin, restoreCoupon)



 //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//=================== OFFER ROUTES =========================
 //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

 
router.get("/offers",isLoggin,loadOfferManagement)

router.get("/offers/create",isLoggin,loadCreateOffer)
router.post("/offers/create",isLoggin,createOffer)
router.get("/offers/edit/:id",isLoggin,loadEditOffer)

export default router