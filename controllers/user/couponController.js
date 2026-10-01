import Cart from "../../models/cartModel.js"
import { calculateCouponDiscount, getAvailableCoupons, validateCoupon } from "../../services/user/couponService.js"
import { calculateBestOffer } from "../../services/user/OfferCalculationService.js"


export const loadCoupons = async (req, res) => {
    try {

        const coupons = await getAvailableCoupons()

        return res.json({
            success: true,
            coupons
        })

    } catch (error) {

        console.log("Load coupons error:", error)

        return res.status(500).json({
            success: false,
            message: "Unable to load coupons."
        })
    }
}


export const applyCoupon = async (req, res) => {
    try {

        const { couponCode } = req.body
        const userId = req.session.user

        if (!couponCode) {
            return res.json({
                success: false,
                message: "Please enter a coupon code."
            })
        }

        const cart = await Cart.findOne({ userId })
            .populate("items.productId")

        if (!cart || cart.items.length === 0) {
            return res.json({
                success: false,
                message: "Your cart is empty."
            })
        }

        let subtotal = 0

        for (const item of cart.items) {
            const offer = await calculateBestOffer(item.productId, item.variantIndex )
            subtotal += offer.finalPrice * item.quantity
        }

        const validation = await validateCoupon( couponCode, userId, subtotal )

        if (!validation.success) {
            return res.json(validation)
        }

        const result = calculateCouponDiscount(validation.coupon, subtotal)

       
        const shipping = subtotal > 999 ? 0 : 99
        const grandTotal = result.grandTotal + shipping

        req.session.checkout = {
            couponId: validation.coupon._id,
            couponCode: validation.coupon.couponCode,
            discount: result.discount
        }

        return res.json({
            success: true,
            couponCode: validation.coupon.couponCode,
            discount: result.discount,
            grandTotal,
            shipping
        })

    } catch (error) {
        console.log("Apply coupon error:", error)
        res.json({
            success: false,
            message: "Something went wrong."
        })
    }
}

export const removeCoupon = async (req, res) => {
    try {

        const userId = req.session.user

        const cart = await Cart.findOne({ userId })
            .populate("items.productId")

        if (!cart || cart.items.length === 0) {
            req.session.checkout = null

            return res.json({
                success: true,
                discount: 0,
                shipping: 0,
                grandTotal: 0
            })
        }

        let subtotal = 0

        for (const item of cart.items) {

            const offer = await calculateBestOffer(
                item.productId,
                item.variantIndex
            )

            if (!offer) continue

            subtotal += offer.finalPrice * item.quantity
        }

        req.session.checkout = null

        const shipping = subtotal > 999 ? 0 : 99
        const grandTotal = subtotal + shipping

        return res.json({
            success: true,
            discount: 0,
            shipping,
            grandTotal: Math.round(grandTotal)
        })

    } catch (error) {
        console.log("Remove coupon error:", error)
        return res.status(500).json({
            success: false,
            message: "Unable to remove coupon."
        })
    }
}