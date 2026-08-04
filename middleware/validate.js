export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false, 
    stripUnknown: true
  })

  if (error) {
    const errors = {}

    error.details.forEach(err => {
      const field = err.path[0]


      if (!errors[field]) {
        errors[field] = err.message.replace(/"/g, "")
      }
    })

    return res.status(400).json({
      success: false,
      errors
    })
  }

  next()
}