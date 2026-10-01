import Coupon from "../../models/couponModel.js"

export const validateCoupon = async (couponCode ,userId,subtotal) => {
    try {
        const now = new Date()

        const coupon = await Coupon.findOne({
            couponCode: couponCode.trim().toUpperCase(),
            isDeleted: false
        })

        if (!coupon) {
            return {
                success: false,
                message: "Invalid coupon."
            }
        }

        if (!coupon.isActive) {
            return {
                success: false,
                message: "Coupon is inactive."
            }
        }

        if (coupon.startDate > now) {
            return {
                success: false,
                message: "Coupon is not active yet."
            }
        }

        if (coupon.expiryDate < now) {
            return {
                success: false,
                message: "Coupon has expired."
            }
        }

        if (subtotal < coupon.minOrderAmount) {
            return {
                success: false,
                message: `Minimum purchase should be ₹${coupon.minOrderAmount}.`
            }
        }

        if (coupon.usedCount >= coupon.usageLimit) {
            return {
                success: false,
                message: "Coupon usage limit exceeded."
            }
        }

        const userUsage = coupon.usedBy?.find( item => item.userId.toString() === userId.toString() )

        if (userUsage && userUsage.count >= coupon.perUserLimit ) {
            return {
                success: false,
                message: "You have already used this coupon."
            }
        }

        return {
            success: true,
            coupon
        }
    } catch (error) {
      console.log("Validate coupon error:", error)

        return {
            success: false,
            message: "Something went wrong."
        } 
    }
}



export const calculateCouponDiscount = (coupon, subtotal) => {
    try {

        let discount = 0

        if (coupon.discountType === "percentage") {
            discount = subtotal * (coupon.discountValue / 100)

            if (coupon.maxDiscountAmount > 0 &&
                discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount
            }
        } else if (coupon.discountType === "fixed") {

            discount = coupon.discountValue
        }
        discount = Math.min(discount, subtotal)

        const grandTotal = subtotal - discount  

        return {
            success: true,
            discount: Math.round(discount),
            grandTotal: Math.round(grandTotal)
        }

    } catch (error) {
        console.log("Calculate coupon discount error:", error)
        return {
            success: false,
            message: "Unable to calculate coupon discount."
        }
    }
}


export const getAvailableCoupons = async () => {
    try {

        const now = new Date()

        const coupons = await Coupon.find({
            isDeleted: false,
            isActive: true,
            startDate: { $lte: now },
            expiryDate: { $gte: now }
        })
        .sort({
            discountValue: -1
        })
        .lean()

        return coupons

    } catch (error) {

        console.log("Get available coupons error:", error)

        return []
    }
}

export const markCouponUsed = async (couponId, userId) => {
    try {

        const coupon = await Coupon.findById(couponId)

        if (!coupon) {
            return
        }

        coupon.usedCount += 1

        const existingUser = coupon.usedBy.find(
            user => user.userId.toString() === userId.toString()
        )
        if (existingUser) {
            existingUser.count += 1
        } else {
            coupon.usedBy.push({
                userId,
                count: 1
            })
        }
        await coupon.save()

    } catch (error) {

        console.log("Mark coupon used error:", error)

    }
}


export const revalidateCheckoutCoupon = async ( req,subtotal) => {

    const checkout = req.session.checkout

    if (!checkout?.couponId) {
        return {
            couponApplied: false,
            couponRemoved: false,
            discount: 0
        }
    }

    const validation = await validateCoupon(checkout.couponCode, req.session.user,subtotal )

    if (!validation.success) {
        req.session.checkout = null
        return {
            couponApplied: false,
            couponRemoved: true,
            discount: 0,
            message: validation.message
        }
    }

    const result = calculateCouponDiscount(  validation.coupon, subtotal )

    if (!result.success) {
        req.session.checkout = null
        return {
            couponApplied: false,
            couponRemoved: true,
            discount: 0,
            message: "Coupon is no longer valid."
        }
    }

  
    req.session.checkout.discount = result.discount

    return {
        couponApplied: true,
        couponRemoved: false,
        discount: result.discount,
        couponCode: validation.coupon.couponCode
    }
}