 import Joi from "joi"

export const categorySchema = Joi.object({

    name: Joi.string()
        .pattern(/^[A-Za-z\s']+$/)
        .trim()
        .min(3)
        .max(50)
        .required()
        .messages({
            "string.empty": "Category name is required",
            "string.min": "Category name must be at least 3 characters",
            "string.max": "Category name cannot exceed 50 characters",
            "string.pattern.base":"Category name only allows alphabets"
        }),
    description: Joi.string()
        .trim()
        .pattern(/^[A-Za-z\s]+$/)
        .min(10)
        .max(300)
        .allow("")
        .messages({
            "string.max": "Description cannot exceed 300 characters",
            "string.min": "Description must contain at least 10 characters",
            "string.pattern.base":"Category description only allows alphabets"
        }),

   

    isActive: Joi.boolean()
        
})