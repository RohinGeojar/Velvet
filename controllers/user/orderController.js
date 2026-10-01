import User from "../../models/user.js";
import { cancelProduct, cancelWholeOrder, getOrders, requestReturnService } from "../../services/user/orderService.js"
import Order from "../../models/order.js"
import puppeteer from "puppeteer"
import ejs from "ejs"
import path from "path"

export const orderHistory = async (req, res) => {
    try {
        const userId = req.session.user;

        const user = await User.findById(userId).lean()
        const data = await getOrders(userId, req.query)

        res.render("user/orderHistory", {
            user,
            data,
            showNavbar: true,
            showSidebar: true,
            currentPage: "order",
            currentpage: data.currentPage,
            totalPages: data.totalPage,
            totalOrders: data.totalOrders,
            search: data.search
        })
    } catch (error) {
        console.log("order history error", error)
    }
}

export const searchOrders = async (req, res) => {
    try {
        const userId = req.session.user


        const data = await getOrders(userId, req.query)

        res.json({
            success: true,
            orders: data.orders,
            currentpage: data.currentPage,
            totalPages: data.totalPage

        })
    } catch (error) {
        console.log("search order error", error)
    }
}

export const orderDetails = async (req, res) => {
    try {
        const userId = req.session.user
        const orderId = req.params.id

        const user = await User.findById(userId).lean()

        const order = await Order.findOne({ _id: orderId, userId }).lean()
      

        if (!order) {
            return
        }

        res.render("user/orderDetails", {
            user,
            order,
            showNavbar: true,
            showSidebar: true,
            currentPage: "order"
        })
    } catch (error) {
        console.log("order Details error", error)
    }
}


export const cancelOrderItem = async (req, res) => {
    try {
        
        const { orderId, itemId } = req.params

        const { reason } = req.body

        const userId = req.user._id

        const result = await cancelProduct(orderId, itemId, userId, reason)

        if (!result.success) {
            return res.status(400).json(result)
        }

        return res.json({
            success: true,
            result
        })



    } catch (error) {
        console.log("cancel order item  error", error)
        return res.status(500).json({

            success: false,

            message: "Something went wrong"

        })
    }
}


export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params
        const { reason } = req.body
        const userId = req.user._id

        const result = await cancelWholeOrder(orderId, userId, reason)

        if (!result.success) {
            return res.status(400).json(result)
        }
        return res.json({
            success: true,
            result
        })

    } catch (error) {
        console.log("Cancel order error", error)
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}

export const requestReturn = async (req, res) => {
    try {
        const { orderId, itemId } = req.params

        const { reason } = req.body

        const userId = req.user._id
        const result = await requestReturnService(orderId, itemId, userId, reason)

        if (!result.success) {
            return res.status(400).json(result)

        }

        return res.json({
            success: true,
            result
        })
    } catch (error) {
        console.log("Return request error", error)
    }
}


export const loadInvoice = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        const order = await Order.findOne({
            _id: req.params.orderId,
            userId: req.user._id
        })
        const invoiceOrder = order.toObject();


        if (!order) {
            return res.status(404).render("404");
        }

        res.render("user/invoice", {
            order: invoiceOrder,
            user,
            showFooter: false
        })
    } catch (error) {
        console.log("load invoce error", error)
    }
}



export const downloadInvoice = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            userId: req.user._id
        })
        const invoiceOrder = order.toObject();

        invoiceOrder.items = invoiceOrder.items.filter(
            item => !["Cancelled", "Returned"].includes(item.status)
        )
        const user = await User.findById(req.user._id)

        if (!order) {
            return res.status(404).send("Order not found")
        }

        const filePath = path.join(
            process.cwd(),
            "views",
            "user",
            "invoice.ejs"
        )

        const html = await ejs.renderFile(filePath, { order: invoiceOrder, user })

        const browser = await puppeteer.launch({
            headless: true
        })

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: "networkidle0"
        })

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "0",
                right: "10mm",
                bottom: "0",
                left: "10mm"
            }
        })

        await browser.close()

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=Invoice-${order.orderId}.pdf`
        })

        res.send(pdf)

    } catch (err) {
        console.error("Invoice Error:", err);
        console.error(err.stack);
        res.status(500).send("Error generating invoice")
    }
}



