import Order from "../../models/order.js"
import PDFDocument from "pdfkit"


export const getSalesReportService = async (period, startDate, endDate) => {
    try {
        let start
        let end
        const now = new Date()

        if (period === "daily") {
            start = new Date()
            start.setHours(0, 0, 0, 0)
            end = new Date()
            end.setHours(23, 59, 59, 999)
        } else if (period === "weekly") {
            start = new Date()
            start.setDate(now.getDate() - 6)
            start.setHours(0, 0, 0, 0)
            end = new Date()
            end.setHours(23, 59, 59, 999)
        } else if (period === "monthly") {
            start = new Date(now.getFullYear(), now.getMonth(), 1)
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        } else if (period === "yearly") {
            start = new Date(now.getFullYear(), 0, 1)
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        } else if (period === "custom") {
            if (!startDate || !endDate) {
                throw new Error("Start date and end date are required")
            }
            start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
        } else {
            start = new Date()
            start.setDate(now.getDate() - 29)
            start.setHours(0, 0, 0, 0)
            end = new Date()
            end.setHours(23, 59, 59, 999)
        }

        const orders = await Order.find({
            createdAt: {
                $gte: start,
                $lte: end
            },
            paymentStatus: "Paid"
        })
            .populate("userId", "firstName lastName")
            .sort({ createdAt: -1 })
            .lean()

        let totalRevenue = 0
        let totalOrders = 0
        let productsSold = 0
        let totalDiscount = 0

        const productMap = new Map()
        const userIds = new Set()
        const recentSales = []
        const reportOrders = []
        const productDetails = []

        const monthlyRevenue = Array(12).fill(0)
        const weeklyOrders = Array(7).fill(0)

        for (const order of orders) {
            const validItems = (order.items || []).filter(
                item =>
                    item.status !== "Cancelled" &&
                    item.status !== "Returned"
            )

            if (validItems.length === 0) continue

            totalOrders++

            if (order.userId?._id) {
                userIds.add(order.userId._id.toString())
            }

            let orderRevenue = 0
            let orderDiscount = 0

            for (const item of validItems) {
                const quantity = Number(item.quantity || 0)
                const itemRevenue = Number(item.finalTotal || 0)
                const itemDiscount =
                    Number(item.productDiscount || 0) +
                    Number(item.couponDiscount || 0)

                const unitPrice = quantity > 0
                    ? itemRevenue / quantity
                    : 0

                productDetails.push({
                    productName: item.productName || "Unknown Product",
                    color: item.color || "-",
                    size: item.size || "-",
                    quantity,
                    unitPrice,
                    revenue: itemRevenue
                })

                productsSold += quantity
                totalDiscount += itemDiscount
                orderDiscount += itemDiscount
                orderRevenue += itemRevenue

                const productId = item.productId?.toString()

                if (!productMap.has(productId)) {
                    productMap.set(productId, {
                        productId,
                        productName: item.productName,
                        quantity: 0,
                        revenue: 0
                    })
                }

                const product = productMap.get(productId)

                product.quantity += quantity
                product.revenue += itemRevenue
            }

            totalRevenue += orderRevenue

            const orderDate = new Date(order.createdAt)
            const month = orderDate.getMonth()
            monthlyRevenue[month] += orderRevenue

            const day = orderDate.getDay()
            weeklyOrders[day]++

            const customerName = order.userId
                ? `${order.userId.firstName || ""} ${order.userId.lastName || ""}`.trim()
                : "Guest"

            reportOrders.push({
                orderId: order.orderId,
                customerName,
                createdAt: order.createdAt,
                paymentMethod: order.paymentMethod || "-",
                paymentStatus: order.paymentStatus || "-",
                orderStatus: order.orderStatus || "-",
                total: orderRevenue,
                grandTotal: Number(order.grandTotal || orderRevenue),
                totalDiscount: orderDiscount
            })

            recentSales.push({
                orderId: order.orderId,
                customerName,
                productName: validItems.length === 1
                    ? validItems[0].productName
                    : "Multiple Items",
                total: orderRevenue,
                status: order.orderStatus || "Processing",
                createdAt: order.createdAt
            })
        }

        const totalCustomers = userIds.size

        const productSales = Array.from(productMap.values()).sort(
            (a, b) => b.revenue - a.revenue
        )

        const averageOrderValue = totalOrders > 0
            ? Number((totalRevenue / totalOrders).toFixed(2))
            : 0
        return {
            period,
            startDate: start,
            endDate: end,
            totalRevenue,
            totalOrders,
            productsSold,
            totalDiscount,
            averageOrderValue,
            totalCustomers,
            productSales,
            productDetails,
            orders: reportOrders,
            recentSales: recentSales.slice(0, 10),
            monthlyRevenue,
            weeklyOrders
        }

    } catch (error) {
        console.log("Get sales report service error:", error)
        throw error
    }
}


export const generateSalesReportPDF = async (period, startDate, endDate) => {
    const report = await getSalesReportService(period, startDate, endDate)

    const doc = new PDFDocument({
        size: "A4",
        margin: 40
    })

    const formatDate = date => {
        if (!date) return "-"
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
    }

    const chunks = []

    doc.on("data", chunk => chunks.push(chunk))

    const pdfPromise = new Promise((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)))
        doc.on("error", reject)
    })

    doc.fontSize(22).font("Helvetica-Bold").text("VELVET VOGUE", { align: "center" })

    doc.moveDown(0.3)

    doc.fontSize(16).text("SALES REPORT", { align: "center" })

    doc.moveDown(0.5)

    doc.fontSize(10).font("Helvetica").text(`Report Period: ${(report.period || period || "Custom").toUpperCase()}`, { align: "center" })

    doc.text(`From: ${formatDate(report.startDate)}    To: ${formatDate(report.endDate)}`, { align: "center" })

    doc.moveDown(0.8)

    doc.fontSize(13).font("Helvetica-Bold").text("Sales Summary", 40, doc.y)

    doc.moveDown(0.3)

    doc.fontSize(10).font("Helvetica")

    doc.text(`Total Revenue: Rs.${Number(report.totalRevenue || 0).toFixed(2)}`)

    doc.text(`Total Orders: ${report.totalOrders || 0}`)

    doc.text(`Products Sold: ${report.productsSold || 0}`)

    doc.text(`Total Discount: Rs.${Number(report.totalDiscount || 0).toFixed(2)}`)

    doc.text(`Average Order Value: Rs.${Number(report.averageOrderValue || 0).toFixed(2)}`)

    doc.text(`Total Customers: ${report.totalCustomers || 0}`)

    doc.moveDown(0.8)

    doc.fontSize(13).font("Helvetica-Bold").text("Order Details", 40, doc.y)

    doc.moveDown(0.4)

    const orders = report.orders || []

    if (orders.length === 0) {
        doc.fontSize(10).font("Helvetica").text("No orders found for this period.")
    } else {
        let y = doc.y

        const drawOrderHeader = () => {
            doc.fontSize(7.5).font("Helvetica-Bold")
            doc.text("Order ID", 40, y, { width: 70 })
            doc.text("Date", 115, y, { width: 55 })
            doc.text("Payment", 175, y, { width: 60 })
            doc.text("Pay Status", 240, y, { width: 60 })
            doc.text("Status", 305, y, { width: 60 })
            doc.text("Amount", 370, y, { width: 70, align: "right" })
            doc.text("Discount", 445, y, { width: 65, align: "right" })
            doc.moveTo(40, y + 12).lineTo(510, y + 12).stroke()
            y += 18
        }

        drawOrderHeader()

        doc.font("Helvetica").fontSize(7)

        for (const order of orders) {
            if (y > 720) {
                doc.addPage()
                y = 50
                drawOrderHeader()
                doc.font("Helvetica").fontSize(7)
            }

            const orderId = order.orderId || order._id?.toString() || "-"
            const orderDate = formatDate(order.createdAt)
            const paymentMethod = order.paymentMethod || "-"
            const paymentStatus = order.paymentStatus || "-"
            const orderStatus = order.orderStatus || "-"
            const amount = Number(order.grandTotal || order.totalAmount || order.total || 0)
            const discount = Number(order.totalDiscount || order.discount || order.couponDiscount || 0)

            doc.text(String(orderId), 40, y, { width: 70 })
            doc.text(orderDate, 115, y, { width: 55 })
            doc.text(paymentMethod, 175, y, { width: 60 })
            doc.text(paymentStatus, 240, y, { width: 60 })
            doc.text(orderStatus, 305, y, { width: 60 })
            doc.text(`Rs.${amount.toFixed(2)}`, 370, y, { width: 70, align: "right" })
            doc.text(`Rs.${discount.toFixed(2)}`, 445, y, { width: 65, align: "right" })

            y += 16
        }
    }

    doc.moveDown(1.2)

    doc.fontSize(13).font("Helvetica-Bold").text("Product Details", 40, doc.y + 20)

    doc.moveDown(0.4)

    const productDetails = report.productDetails || []

    if (productDetails.length === 0) {
        doc.fontSize(10).font("Helvetica").text("No product details found for this period.")
    } else {
        let y = doc.y

        doc.fontSize(8).font("Helvetica-Bold")

        doc.text("Product", 40, y, { width: 185 })
        doc.text("Color", 230, y, { width: 65 })
        doc.text("Size", 295, y, { width: 45 })
        doc.text("Qty", 340, y, { width: 40, align: "right" })
        doc.text("Unit Price", 390, y, { width: 75, align: "right" })
        doc.text("Revenue", 475, y, { width: 75, align: "right" })

        doc.moveTo(40, y + 13).lineTo(550, y + 13).stroke()

        y += 20

        doc.font("Helvetica").fontSize(8)

        for (const product of productDetails) {
            if (y > 720) {
                doc.addPage()
                y = 50

                doc.font("Helvetica-Bold").fontSize(8)

                doc.text("Product", 40, y, { width: 185 })
                doc.text("Color", 230, y, { width: 65 })
                doc.text("Size", 295, y, { width: 45 })
                doc.text("Qty", 340, y, { width: 40, align: "right" })
                doc.text("Unit Price", 390, y, { width: 75, align: "right" })
                doc.text("Revenue", 475, y, { width: 75, align: "right" })

                doc.moveTo(40, y + 13).lineTo(550, y + 13).stroke()

                y += 20

                doc.font("Helvetica").fontSize(8)
            }

            const productName = product.productName || "Unknown Product"
            const color = product.color || "-"
            const size = product.size || "-"
            const quantity = Number(product.quantity || 0)
            const revenue = Number(product.revenue || 0)
            const unitPrice = Number(product.unitPrice || (quantity > 0 ? revenue / quantity : 0))

            doc.text(productName, 40, y, { width: 185 })
            doc.text(color, 230, y, { width: 65 })
            doc.text(size, 295, y, { width: 45 })
            doc.text(String(quantity), 340, y, { width: 40, align: "right" })
            doc.text(`Rs.${unitPrice.toFixed(2)}`, 390, y, { width: 75, align: "right" })
            doc.text(`Rs.${revenue.toFixed(2)}`, 475, y, { width: 75, align: "right" })

            y += 16
        }
    }

   const generatedText = `Generated on ${new Date().toLocaleString("en-IN")}`

doc.fontSize(8).font("Helvetica").fillColor("#666666").text(generatedText, 40, doc.page.height - 55, { width: doc.page.width - 80, align: "center" })

    doc.end()

    return pdfPromise
}