 import Joi from "joi";

 export const signupSchema = Joi.object({
    firstName: Joi.string().min(3).required(),
    lastName: Joi.string().allow("").optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().min(6).required()
 })

 export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});