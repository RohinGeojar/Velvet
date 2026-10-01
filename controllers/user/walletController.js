import User from "../../models/user.js"
import { creditWalletService, getWalletService } from "../../services/user/walletService.js"
import razorpay from "../../config/razorpay.js"
import crypto from "crypto"

export const loadWallet = async (req, res, next) => {

    try {
        const page = Number(req.query.page) || 1
       


        const {wallet,transactions,currentpage, totalPages,totalTransactions} = await getWalletService(req.user._id,page)
        const user = await User.findById(req.user._id).lean()

        res.render("user/wallet", {
            wallet,
            user,
            transactions,
            currentpage,
            totalPages,
            currentPage: "wallet",
            totalTransactions,
            showNavbar: true,
            showSidebar: true,
        })

    } catch (error) {
        console.log("Load  wallet controller error", error)
        next(error)
    }

}

export const getWallet = async (req, res, next) => {

    try {
        let page =  parseInt(req.query.page) || 1
        const walletData = await getWalletService(req.user._id,page)

        res.json({
            success: true,
            wallet:walletData.wallet
        })

    } catch (error) {
        console.log("Get wallet controller error", error)
        next(error)
    }

}





export const createWalletOrder = async (req, res, next) => {
    try {

        const amount = Number(req.body.amount)

        if (!amount || amount < 100) {
            return res.status(400).json({
                success: false,
                message: "Minimum top-up amount is ₹100"
            })
        }

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `wallet_${Date.now()}`
        }

        const order = await razorpay.orders.create(options)

        res.json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID
        })

    } catch (error) {
        console.log("Create wallet order controller error", error)
        next(error)
    }
}

export const verifyWalletPayment = async (req, res, next) => {
    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,

        } = req.body

        const body = razorpay_order_id + "|" + razorpay_payment_id

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex")

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            })
        }
        const razorpayOrder = await razorpay.orders.fetch(
            razorpay_order_id
        )

        const amount = razorpayOrder.amount / 100


        const wallet = await creditWalletService(
            req.user._id,
            Number(amount),
            "Wallet Top-up",
            "wallet_topup"
        )

        return res.json({
            success: true,
            message: "Money added successfully",
            balance: wallet.balance
        })

    } catch (error) {
        console.log("Verify wallet payment error:", error)
        next(error)
    }
}