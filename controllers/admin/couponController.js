import { createCouponService, deleteCouponService, getCouponByIdService, getCouponService, restoreCouponService, toggleCouponService, updateCouponService } from "../../services/admin/couponService.js"
import { couponSchema } from "../../validators/couponValidator.js"



export const loadCouponManagement = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1

        const limit =  5

        const search = req.query.search || ""
        const status = req.query.status || ""
        const discountType = req.query.discountType || ""
        const sort = req.query.sort || "latest"

        const data = await getCouponService({
            page,
            limit,
            search,
            status,
            discountType,
            sort
        })
      
        

        res.render("admin/couponManagement", {
            ...data,
            activeNavLink: "Coupon",
            showFooter: false
        })
    } catch (error) {
        console.log("load coupon management error", error)
    }
}


// LOAD CREATE COUPON

export const loadCreateCoupon = async (req, res) => {
    try {
        res.render("admin/createCoupon", {
            coupon: null,
            isEdit: false,
            activeNavLink: "Coupon",
            showFooter: false
        })
    } catch (error) {
        console.log("create coupon management error", error)
    }
}


// CREATE COUPON
export const createCoupon = async (req, res) => {
    try {
        const { error, value } = couponSchema.validate(req.body, {
            abortEarly: false
        })
        const { discountValue, discountType, maxDiscountAmount, usageLimit, perUserLimit, minOrderAmount } = value

        const errors = {}
        if (error) {

            error.details.forEach(err => {
                errors[err.path[0]] = err.message;
            })


            return res.status(400).json({
                success: false,
                errors
            })
        }

        if (discountType === "percentage" && Number(discountValue) > 100) {
            errors.discountValue = "Percentage discount cannot be greater than 100."
        }

        if (discountType === "percentage" && (!maxDiscountAmount || maxDiscountAmount === "" || Number(maxDiscountAmount) <= 0)) {
            errors.maxDiscountAmount = "maximum discount amount is required for percentage coupons."
        }
        if (discountType === "fixed" && Number(discountValue) > Number(minOrderAmount)) {
            errors.discountValue = "Discount value cannot be greater than minimum purchase amount."
        }
        if (Number(perUserLimit) > Number(usageLimit)) {
            errors.perUserLimit = "Per user limit cannot exceed total usage limit."
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                errors
            })
        }

        const result = await createCouponService(value)

        if (!result.success) {
            return res.status(400).json({
                success: false,
                errors: {
                    couponCode: result.message
                }
            })
        }
        return res.json({
            success: true,
            message: "coupon created successfully"
        })

    } catch (error) {
        console.log("create coupon management error", error)
    }
}
// LOAD EDIT COUPON


export const loadEditCoupon = async (req, res) => {

    try {

        const coupon = await getCouponByIdService(req.params.id)

        if (!coupon) {
            return res.redirect("/couponManagement")
        }

        res.render("admin/createCoupon", {
            coupon,
            isEdit: true,
            activeNavLink: "Coupon",
            showFooter: false
        })

    } catch (error) {
        console.log(error)
    }

}

// EDIT COUPON

export const updateCoupon = async (req, res) => {

    try {
        
        const { error, value } = couponSchema.validate(req.body, {
            abortEarly: false
        })

      
        const errors = {}
        if (error) {
            error.details.forEach(err => {
                errors[err.path[0]] = err.message;
            })

            return res.status(400).json({
                success: false,
                errors
            })
        }

        const {
            discountValue,
            discountType,
            maxDiscountAmount,
            usageLimit,
            perUserLimit,
            minOrderAmount
        } = value

        if (discountType === "percentage" && Number(discountValue) > 100) {
            errors.discountValue = "Percentage discount cannot exceed 100."
        }

        if (discountType === "percentage" &&(!maxDiscountAmount || Number(maxDiscountAmount) <= 0)) {
            errors.maxDiscountAmount = "Maximum discount amount is required."
        }

        if (discountType === "fixed" && Number(discountValue) > Number(minOrderAmount) ) {
            errors.discountValue = "Discount cannot exceed minimum order amount."
        }

        if (Number(perUserLimit) > Number(usageLimit)) {
            errors.perUserLimit ="Per user limit cannot exceed usage limit."
        }

        if (Object.keys(errors).length) {
            return res.status(400).json({
                success: false,
                errors
            })
        }

        const result = await updateCouponService(req.params.id, value)

        if (!result.success) {
            return res.status(400).json({
                success: false,
                errors: {
                    couponCode: result.message
                }
            })
        }

        return res.json({
            success: true,
            message: "Coupon updated successfully."
        })

    } catch (error) {

        console.log("update coupon error", error)

    }

}


export const toggleCoupon = async (req, res) => {

    try {

        const coupon = await toggleCouponService(req.params.id)

        if (!coupon) {
            return res.status(404).json({
                success: false
            })
        }

        res.json({
            success: true
        })

    } catch (error) {

        console.log(error)

        res.status(500).json({
            success: false
        })

    }

}


// DELETE COUPON
export const deleteCoupon = async (req, res) => {

    try {

        await deleteCouponService(req.params.id)

        res.json({
            success: true
        })

    } catch (error) {

        console.log(error)

        res.status(500).json({
            success: false
        })

    }

}


// RESTORE CCOUPON

export const restoreCoupon = async (req, res) => {

    try {

        const coupon = await restoreCouponService(req.params.id)

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            })
        }
        res.json({
            success: true,
            message: "Coupon restored successfully."
        })

    } catch (error) {
        console.log("Restore coupon controller error", error)

        res.status(500).json({
            success: false,
            message: "Something went wrong."
        })
    }
}





                                            //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                                            //================= OFFER MANAGEMENT =======================
                                            //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


export const loadOfferManagement = async (req, res) => {
    try {
        res.render("admin/offerManagement", {
            activeNavLink: "Offers",
            showFooter: false
        })
    } catch (error) {

    }
}