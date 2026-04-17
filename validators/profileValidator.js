import Joi from "joi";

export const profileUpdateSchema = Joi.object({
  firstName: Joi.string().min(3).max(30).required(),

  lastName: Joi.string().min(1).max(30).required(),

  email: Joi.string().email().required(),

  phone: Joi.alternatives().try(
  Joi.string().pattern(/^[6-9]\d{9}$/),
  Joi.string().allow("")
)
})

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),

  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters"
    }),

  confirmPassword: Joi.string()
  .required()
  .valid(Joi.ref("newPassword"))
  .messages({
    "any.only": "Passwords do not match",
    "string.empty": "Confirm password is required"
  })
})