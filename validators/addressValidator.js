import Joi from "joi";

export const addressSchema = Joi.object({
  country: Joi.string().required(),

  firstName: Joi.string().required(),

  lastName: Joi.string().required(),

  addressLine1: Joi.string().min(5).required(),

  addressLine2: Joi.string().allow("").optional(),

  landmark: Joi.string().allow("").optional(),

  city: Joi.string().required(),

  postalCode: Joi.string()
    .pattern(/^[1-9][0-9]{5}$/)
    .required()
    .messages({
      "string.pattern.base": "Postal code must be 6 digits and not start with 0"
    }),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),

  isDefault: Joi.boolean().optional()
});