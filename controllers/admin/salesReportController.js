import { getSalesReportService,generateSalesReportPDF } from "../../services/admin/salesReportService.js"
import ExcelJS from "exceljs"

export const loadSalesReport = async (req, res, next) => {
    try {
        const { period = "monthly", startDate, endDate } = req.query

        const report = await getSalesReportService(
            period,
            startDate,
            endDate
        )

        res.render("admin/salesReport", {
            report,
            activeNavLink: "Sales Report",
            showFooter: false
        })

    } catch (error) {
        console.log("Load sales report error:", error)
        next(error)
    }
}

export const getSalesReport = async (req, res, next) => {
    try {
        const { period = "monthly", startDate, endDate } = req.query

        const report = await getSalesReportService( period, startDate, endDate  )

        return res.json({
            success: true,
            data: report
        })

    } catch (error) {
        console.log("Get sales report error:", error)
        next(error)
    }
}

export const downloadSalesReportPDF = async (req, res, next) => {
    try {
        const { period = "monthly", startDate, endDate } = req.query

        const pdfBuffer = await generateSalesReportPDF(
            period,
            startDate,
            endDate
        )

        const fileName = `sales-report-${period}-${Date.now()}.pdf`

        res.setHeader("Content-Type", "application/pdf")
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        )
        res.setHeader("Content-Length", pdfBuffer.length)

        res.end(pdfBuffer)

    } catch (error) {
        console.log("Download sales report PDF error:", error)
        next(error)
    }
}

export const downloadSalesReportExcel = async (req, res, next) => {
    try {

        const {
            period = "monthly",
            startDate,
            endDate
        } = req.query

        const report = await getSalesReportService(
            period,
            startDate,
            endDate
        )

        const workbook = new ExcelJS.Workbook()

        workbook.creator = "Velvet Vogue"
        workbook.created = new Date()

        const worksheet = workbook.addWorksheet("Sales Report")


    
        worksheet.mergeCells("A1:F1")

        const titleCell = worksheet.getCell("A1")

        titleCell.value = "VELVET VOGUE - SALES REPORT"

        titleCell.font = {
            bold: true,
            size: 16
        }

        titleCell.alignment = {
            horizontal: "center"
        }


        worksheet.mergeCells("A2:F2")

        const periodCell = worksheet.getCell("A2")

        periodCell.value =
            `Report Period: ${period}`

        periodCell.alignment = {
            horizontal: "center"
        }


       
        worksheet.addRow([])

        const summaryTitle =
            worksheet.addRow(["SALES SUMMARY"])

        summaryTitle.font = {
            bold: true,
            size: 13
        }

        worksheet.addRow([
            "Total Revenue",
            Number(report.totalRevenue || 0)
        ])

        worksheet.addRow([
            "Total Orders",
            Number(report.totalOrders || 0)
        ])

        worksheet.addRow([
            "Average Order Value",
            Number(report.averageOrderValue || 0)
        ])

        worksheet.addRow([
            "Total Customers",
            Number(report.totalCustomers || 0)
        ])



        worksheet.addRow([])

        const productTitle =
            worksheet.addRow(["TOP SELLING PRODUCTS"])

        productTitle.font = {
            bold: true,
            size: 13
        }

        const productHeader =
            worksheet.addRow([
                "Product",
                "Units Sold",
                "Revenue"
            ])

        productHeader.font = {
            bold: true
        }

        for (const product of report.productSales || []) {

            worksheet.addRow([
                product.productName || "Unknown Product",
                Number(product.quantity || 0),
                Number(product.revenue || 0)
            ])
        }


        worksheet.addRow([])

        const recentSalesTitle =
            worksheet.addRow(["RECENT SALES"])

        recentSalesTitle.font = {
            bold: true,
            size: 13
        }

        const salesHeader =
            worksheet.addRow([
                "Order ID",
                "Customer",
                "Product",
                "Total",
                "Status",
                "Date"
            ])

        salesHeader.font = {
            bold: true
        }

        for (const sale of report.recentSales || []) {

            worksheet.addRow([
                sale.orderId || "N/A",
                sale.customerName || "Guest",
                sale.productName || "Multiple Items",
                Number(sale.total || 0),
                sale.status || "Processing",
                sale.createdAt
                    ? new Date(sale.createdAt)
                        .toLocaleDateString("en-IN")
                    : ""
            ])
        }


        
        worksheet.getColumn(1).width = 32
        worksheet.getColumn(2).width = 22
        worksheet.getColumn(3).width = 30
        worksheet.getColumn(4).width = 18
        worksheet.getColumn(5).width = 18
        worksheet.getColumn(6).width = 18


     
        worksheet.eachRow((row) => {

            row.eachCell((cell) => {

                if (typeof cell.value === "number") {

                    cell.numFmt = '₹#,##0.00'

                }

            })

        })


    
        worksheet.views = [
            {
                state: "frozen",
                ySplit: 3
            }
        ]


      
        const fileName = `sales-report-${period}-${Date.now()}.xlsx`

        res.setHeader(  "Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        res.setHeader( "Content-Disposition", `attachment; filename="${fileName}"` )

        await workbook.xlsx.write(res)

        res.end()

    } catch (error) {

        console.log( "Download sales report Excel error:",   error )

        next(error)
    }
}