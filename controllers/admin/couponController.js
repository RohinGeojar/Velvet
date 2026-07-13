import { couponSchema } from "../../validators/couponValidator.js"



export const loadCouponManagement = async (req, res) => {
    try {
        res.render("admin/couponManagement", {
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
        console.log(req.body)

        const { discountValue, discountType, maxDiscountAmount, usageLimit, perUserLimit,minOrderAmount } = req.body

        const { error } = couponSchema.validate(req.body, {
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

        if(discountType === "percentage" && Number(discountValue)>100){
            errors.discountValue = "Percentage discount cannot be greater than 100."
        }

        if(discountType === "percentage" && (!maxDiscountAmount ||maxDiscountAmount ==="" || Number(maxDiscountAmount)<= 0)){
            errors.maxDiscountAmount = "maximum discount amount is required for percentage coupons."
        }
        if(discountType === "fixed" && Number(discountValue)>Number(minOrderAmount)){
            errors.discountValue = "Discount value cannot be greater than minimum purchase amount."
        }
        if(Number(perUserLimit)>Number(usageLimit)){
            errors.perUserLimit=  "Per user limit cannot exceed total usage limit."
        }

        if(Object.keys(errors).length>0){
            return res.status(400).json({
                success:false,
                errors
            })
        }

    } catch (error) {
        console.log("create coupon management error", error)
    }
}
// LOAD EDIT COUPON
export const loadEditCoupon = async (req, res) => {
    try {


        res.render("admin/createCoupon", {
            coupon,
            isEdit: true,
            activeNavLink: "Coupon",
            showFooter: false
        })
    } catch (error) {
        console.log("create coupon management error", error)
    }
}

// EDIT COUPON
