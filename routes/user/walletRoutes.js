import express from "express"
import { createWalletOrder, getWallet, loadWallet, verifyWalletPayment } from "../../controllers/user/walletController.js"
import { userAuth } from "../../middleware/auth.js"


const router = express.Router()

router.get("/", userAuth, loadWallet)

router.get("/details", userAuth, getWallet)
router.post("/createOrder",userAuth,createWalletOrder)
router.post("/verifyPayment",userAuth,verifyWalletPayment)


export default router