import express from "express"
import { getDashboardData, loadDashBoard } from "../../controllers/admin/dashboardController.js"
import { isLoggin } from "../../middleware/admin/authMiddilware.js"

const router = express.Router()

router.get("/",isLoggin, loadDashBoard)
router.get("/data",isLoggin, getDashboardData)

export default router 