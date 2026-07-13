import express from "express"
import { approveReturn, loadOrderDetails, loadOrderManagement, rejectReturn, updateStatus } from "../../controllers/admin/orderController.js"
import { isLoggin } from "../../middleware/admin/authMiddilware.js"
import { updateOrderStatus } from "../../services/admin/orderService.js"

const router = express.Router()

router.get("/", isLoggin, loadOrderManagement)
router.get("/:id", isLoggin, loadOrderDetails)


router.patch("/:id/status",isLoggin,updateStatus)

router.patch("/:orderId/items/:itemId/approveReturn",isLoggin,approveReturn)
router.patch("/:orderId/items/:itemId/rejectReturn",isLoggin,rejectReturn)

export default router 