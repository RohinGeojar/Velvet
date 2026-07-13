import Joi from "joi";

export const addressSchema = Joi.object({
  country: Joi.string()
  .pattern(/^[A-Za-z\s]+$/)
  .required()
  .messages({
    "string.pattern.base": "Country must contain only letters"
  }),

  firstName: Joi.string()
  .pattern(/^[A-Za-z]+$/)
  .required()
  .messages({
        "string.empty": "First name is required",
        "any.required": "First name is required",
        "string.pattern.base": "First name should contain only letters"
    }),

lastName: Joi.string()
  .pattern(/^[A-Za-z]+$/)
  .required()
  .messages({
        "string.empty": "Last name is required",
        "any.required": "Last name is required",
        "string.pattern.base": "Last name should contain only letters"
    }),

  addressLine1: Joi.string().min(5).required(),

  addressLine2: Joi.string().allow("").optional(),

  landmark: Joi.string().allow("").optional(),

  city: Joi.string()
  .pattern(/^[A-Za-z\s]+$/)
  .required()
  
  .messages({
    "string.pattern.base": "City must contain only letters"
  }),

  postalCode: Joi.string()
    .pattern(/^[1-9][0-9]{5}$/)
    .required()
    .max(6)
    .min(6)
    .messages({
      "string.max": "Postal code cannot exceed 6 digits",
      "string.min": "Postal code require minimum 6 digits",
      "string.pattern.base": "Postal code must be 6 digits and not start with 0"
    }),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .min(10)
    .max(10)
    .messages({
      "string.max": "Phone number cannot exceed 10 digits",
      "string.min": "phone number require minimum 10 digits",
      "string.pattern.base": "phone number must be 10 digits and not start with 0-5"
    }),

  isDefault: Joi.boolean()
  .truthy("on")
  .default(false)
});