
import Joi from "joi"


const sizeSchema = Joi.object({
    size: Joi.string()
        .trim()
        .required()
        .valid("S", "M", "L", "XL")
        .messages({
            "string.empty": "Size is required",
            "any.required": "Size is required",
            "any.only": "Invalid size selected",
        }),

    stock: Joi.number()
        .integer()
        .required()
        .min(0)
        .messages({
            "number.base": "Stock must be a number",
            "number.min": "Stock cannot be negative",
            "any.required": "Stock is required"
        })
})



const variantSchema = Joi.object({
    color: Joi.string()
        .trim()
        .pattern(/^(?=.*[A-Za-z])[A-Za-z\s\-]+$/)
        .min(3)
        .max(20)
        .required()
        .messages({
            "string.empty": "Color is required",
            "string.min": "Color must be at least 3 characters",
            "string.max": "Color cannot exceed 20 characters",
            "string.pattern.base": "Color name must be valid"
        }),
    colorCode: Joi.string()
        .trim()
        .required(),

    regularPrice: Joi.number()
        .min(1)
        .required()
        .messages({
            "number.base": "Regular price must be a number",
            "number.min": "Regular price must be greater than 0",
            "any.required": "Regular price is required"
        }),

    salePrice: Joi.number()
        .min(0)
        .required()
        .custom((value, helpers) => {

            const { regularPrice } = helpers.state.ancestors[0]

            if (value > regularPrice) {
                return helpers.error("any.invalid")
            }

            return value
        })
        .messages({
            "number.base": "Sale price must be a number",
            "number.min": "Sale price cannot be negative",
            "any.required": "Sale price is required",
            "any.invalid": "Sale price cannot exceed regular price"
        }),
    existingImages: Joi.array().optional(),

    sizes: Joi.array()
        .items(sizeSchema)
        .min(1)
        .messages({
            "array.min": "At least one size is required",
            "any.required": "Sizes are required"
        })
})



export const productSchema = Joi.object({

    productName: Joi.string()
        .trim()
        .pattern(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'",.&()]+$/)
        .min(3)
        .max(50)
        .required()
        .messages({
            "string.empty": "Product name is required",
            "string.min": "Product name must be at least 3 characters",
            "string.max": "Product name cannot exceed 50 characters",
            "string.pattern.base": "Product name must be valid"
        }),
    productSlug: Joi.string()
        .allow(""),

    productTitle: Joi.string()
        .trim()
        .pattern(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'",.&()]+$/)
        .min(3)
        .max(100)
        .required()
        .messages({
            "string.empty": "Product title is required",
            "string.min": "Product title must be at least 3 characters",
            "string.max": "Product title cannot exceed 100 characters",
            "string.pattern.base": "Product title must be valid"
        }),

    description: Joi.string()
        .trim()
        .min(10)
        .max(800)
        .required()
        .messages({
            "string.empty": "Description is required",
            "string.min": "Description must be at least 10 characters",
            "string.max": "Description cannot exceed 500 characters"
        }),

    category: Joi.string()
        .required()
        .messages({
            "string.empty": "Category is required",
            "any.required": "Category is required"
        }),

    materialDetails: Joi.string()
        .trim()
        .max(300)
        .required()
        .messages({
            "string.empty": "Fabric details are required",
            "string.max": "Fabric details cannot exceed 300 characters"
        }),

    materialCare: Joi.string()
        .trim()
        .max(300)
        .required()
        .messages({
            "string.empty": "Fabric care is required",
            "string.max": "Fabric care cannot exceed 300 characters"
        }),

    shippingDetails: Joi.string()
        .trim()
        .max(300)
        .required()
        .messages({
            "string.empty": "Shipping details are required",
            "string.max": "Shipping details cannot exceed 300 characters"
        }),

    variants: Joi.array()
    .items(variantSchema)
    .min(1)
    .required()
    .unique((a, b) => {
        return a.color.trim().toLowerCase() ===
               b.color.trim().toLowerCase();
    })
    .messages({
        "array.min": "At least one variant is required",
        "any.required": "Variants are required",
        "array.unique": "Each variant must have a unique color"
    }),
    isActive: Joi.boolean()
        .default(true),
    isDeleted: Joi.boolean()
        .default(false)

})


//abortEarly: false