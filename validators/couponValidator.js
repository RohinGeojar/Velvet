import Joi from "joi"

export const couponSchema = Joi.object({
    couponCode: Joi.string()
        .trim()
        .min(4)
        .max(15)
        .uppercase()
        .pattern(/^(?=.*[A-Z])[A-Z0-9]{4,15}$/)
        .required()
        .messages({
            "string.empty": "Coupon Code is required",
            "string.min": "Minimum 4 characters required",
            "string.max": "Maximum 15 characters alloweded",
            "any.required": "Coupon Code is required",
            "string.pattern.base": "Coupon code must contain at least one letter, use only    letters and numbers, and be 4-15 characters long."
        }),
    couponName: Joi.string()
        .trim()
        .min(3)
        .max(20)
        .pattern(/^[A-Za-z][A-Za-z0-9 ]*$/)
        .required()
        .messages({
            "string.empty": "Coupon name is required",
            "any.required": "Coupon name is required",
            "string.min": "Minimum 3 characters required",
            "string.max": "Maximum 20 characters alloweded",
            "string.pattern.base": "Coupon name must start with a letter and can contain letters, numbers, and spaces."
        }),
    discountType: Joi.string()
        .valid("percentage", "fixed")
        .required()
        .messages({
            "any.only": "Discount type must be Percentage or Fixed.",
            "string.empty": "Discount type is required.",
            "any.required": "Discount type is required."
        }),
    discountValue: Joi.number()
        .min(1)
        .required()
        .messages({
            "number.base": "Discount value must be a number.",
            "number.min": "Discount value must be greater than 0.",
            "any.required": "Discount value is required."
        }),
    minOrderAmount: Joi.number()
        .min(0)
        .required()
        .messages({
            "number.base": "Minimum purchase amount must be a number.",
            "number.min": "Minimum purchase amount cannot be negative.",
            "any.required": "Minimum purchase amount is required."
        }),
    maxDiscountAmount: Joi.number()
        .min(0)
        .allow("",null)
        .optional()
        .messages({
            "number.base": "Maximum discount amount must be a number.",
            "number.min": "Maximum discount amount cannot be negative.",
        }),

    usageLimit: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            "number.base": "Usage limit must be a number.",
            "number.integer": "Usage limit must be a whole number.",
            "number.min": "Usage limit must be at least 1.",
            "any.required": "Usage limit is required.",
           
        }),

    perUserLimit: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            "number.base": "Per user limit must be a number.",
            "number.integer": "Per user limit must be a whole number.",
            "number.min": "Per user limit must be at least 1.",
            "any.required": "Per user limit is required."
        }),
    startDate: Joi.date()
        .required()
        .messages({
            "date.base": "Please select a valid start date.",
            "any.required": "Start date is required."
        }),

    expiryDate: Joi.date()
        .greater(Joi.ref("startDate"))
        .required()
        .messages({
            "date.base": "Please select a valid expiry date.",
            "date.greater": "Expiry date must be later than the start date.",
            "any.required": "Expiry date is required."
        }),
    isActive: Joi.boolean()
        .required()
        .messages({
            "boolean.base": "Status must be Active or Inactive.",
            "any.required": "Coupon status is required."
        }),

})