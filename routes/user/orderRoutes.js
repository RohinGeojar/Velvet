import express from "express"
import { userAuth } from "../../middleware/auth.js"
import { cancelOrder, cancelOrderItem, downloadInvoice, loadInvoice, orderDetails, orderHistory, requestReturn, searchOrders } from "../../controllers/user/orderController.js"

const router = express.Router()

router.get("/",userAuth,orderHistory)
router.get("/search",userAuth,searchOrders)

router.get("/details/:id",userAuth,orderDetails)

router.patch("/:orderId/cancel", userAuth,cancelOrder)
router.patch("/:orderId/items/:itemId/cancel",userAuth,cancelOrderItem)

router.patch("/:orderId/items/:itemId/return",userAuth,requestReturn)

router.get("/:orderId/invoice",userAuth,loadInvoice)
router.get("/invoice/:orderId/download",userAuth, downloadInvoice)


export default router

