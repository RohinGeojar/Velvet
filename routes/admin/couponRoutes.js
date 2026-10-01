import express from "express"
import { isLoggin } from "../../middleware/admin/authMiddilware.js"
import { createCoupon, createOffer, deleteCoupon, deleteOffer, loadCouponManagement, loadCreateCoupon, loadCreateOffer, loadEditCoupon, loadEditOffer, loadOfferManagement, restoreCoupon, restoreOffer, toggleCoupon, toggleOffer, updateCoupon, UpdateOffer } from "../../controllers/admin/couponController.js"

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
router.post("/offers/edit/:id",isLoggin,UpdateOffer)

router.patch("/offers/toggle/:id", isLoggin, toggleOffer)

router.delete("/offers/delete/:id", isLoggin, deleteOffer)
router.patch("/offers/restore/:id", isLoggin, restoreOffer)

export default router