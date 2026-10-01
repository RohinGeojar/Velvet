import express from "express"
import { loadSalesReport,getSalesReport, downloadSalesReportPDF, downloadSalesReportExcel} from "../../controllers/admin/salesReportController.js"
import { isLoggin } from "../../middleware/admin/authMiddilware.js"

const router = express.Router()

router.get( "/",isLoggin, loadSalesReport)
router.get( "/data", isLoggin, getSalesReport)
router.get("/downloadPdf", downloadSalesReportPDF)
router.get( "/downloadExcel", downloadSalesReportExcel)

export default router