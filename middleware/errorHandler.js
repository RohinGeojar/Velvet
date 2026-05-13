import { STATUS } from "../utils/statusCodes.js"
import { MESSAGES } from "../utils/messages.js"

export const errorHandler = (err, req, res, next) => {
     console.error("ERROR : ",err)

     const statusCode = err.statusCode || STATUS.INTERNAL_SERVER_ERROR

     res.status(statusCode).json({
        success:false,
        message:err.message || MESSAGES.SERVER_ERROR
     })
}