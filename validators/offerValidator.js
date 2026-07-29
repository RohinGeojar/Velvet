import Joi from "joi";

export const offerSchema = Joi.object({

    offerName: Joi.string()
        .trim()
        .min(3)
        .max(30)
        .pattern(/^[A-Za-z][A-Za-z0-9 ]*$/)
        .required()
        .messages({
            "string.empty": "Offer name is required",
            "string.min": "Minimum 3 characters",
            "string.max": "Maximum 30 characters",
            "string.pattern.base": "Must start with a letter and contain only letters, numbers and spaces"
        }),

    description: Joi.string()
        .allow("")
        .max(200)
        .messages({
            "string.max": "Maximum 200 characters"
        }),

    offerType: Joi.string()
        .valid("product", "category")
        .required()
        .messages({
            "string.empty": "Offer type is required",
            "any.only": "Invalid offer type"
        }),

    products: Joi.when("offerType", {
        is: "product",
        then: Joi.array()
            .items(Joi.string())
            .min(1)
            .required()
            .messages({
                "array.min": "Select at least one product",
                "any.required": "Select at least one product"
            }),
        otherwise: Joi.array().default([])
    }),

    categories: Joi.when("offerType", {
        is: "category",
        then: Joi.array()
            .items(Joi.string())
            .min(1)
            .required()
            .messages({
                "array.min": "Select at least one category",
                "any.required": "Select at least one category"
            }),
        otherwise: Joi.array().default([])
    }),

    discountType: Joi.string()
        .valid("percentage", "fixed")
        .required()
        .messages({
            "string.empty": "Discount type is required",
            "any.only": "Invalid discount type"
        }),

    discountValue: Joi.number()
        .min(1)
        .required()
        .messages({
            "number.base": "Discount value is required",
            "number.min": "Discount must be greater than 0"
        }),

    maxDiscountAmount: Joi.when("discountType", {
        is: "percentage",
        then: Joi.number()
            .required()
            .messages({
                "number.base": "Maximum discount amount is required"
            }),
        otherwise: Joi.allow("", null)
    }),

    startDate: Joi.date()
        .required()
        .messages({
            "date.base": "Start date is required"
        }),

    expiryDate: Joi.date()
        .greater(Joi.ref("startDate"))
        .required()
        .messages({
            "date.base": "Expiry date is required",
            "date.greater": "Expiry date must be after start date"
        }),

    isActive: Joi.boolean()

})