import Joi from "joi"

export const signupSchema = Joi.object({
    firstName: Joi.string().min(3).required().messages({
        "string.empty": "First name is required",
        "string.min": "First name must be at least 3 characters",
        "any.required": "First name is required"
    }),

    lastName: Joi.string().allow("").optional(),

    email: Joi.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Please enter a valid email address",
        "any.required": "Email is required"
    }),

    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional().messages({
        "string.pattern.base": "Enter a valid 10-digit Indian mobile number"
    }),

    password: Joi.string().min(6).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters",
        "any.required": "Password is required"
    }),

    confirmPassword: Joi.string().min(6).required().valid(Joi.ref("password")).messages({
        "string.empty": "Confirm password is required",
        "string.min": "Confirm password must be at least 6 characters",
        "any.required": "Confirm password is required",
        "any.only": "Passwords do not match"
    })
})

export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Please enter a valid email address",
        "any.required": "Email is required"
    }),

    password: Joi.string().required().messages({
        "string.empty": "Password is required",
        "any.required": "Password is required"
    })
})