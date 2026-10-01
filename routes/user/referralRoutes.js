import express from "express"
import {  userAuth } from '../../middleware/auth.js'
import {getReferralPage,getReferralCode,checkReferralCode,useReferralCode,} from "../../controllers/user/referralController.js"



const router = express.Router()

router.get("/referral",userAuth, getReferralPage)
router.get( "/referral/code", userAuth, getReferralCode)
router.post( "/referral/validate", userAuth, checkReferralCode)
router.post( "/referral/apply", userAuth,useReferralCode)

export default router