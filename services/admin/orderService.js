

import Order from "../../models/order.js"
import User from "../../models/user.js"
import Product from "../../models/productModel.js"

export const getOrders = async ({ page, limit, search, status, sort }) => {
    try {
        const query = {}

        if (search) {
            const users = await User.find({
                $or: [
                    {
                        firstName: { $regex: search, $options: "i" }
                    },
                    {
                        lastName: { $regex: search, $options: "i" }
                    },
                    {
                        email: { $regex: search, $options: "i" }
                    }

                ]
            }).select("_id")

            query.$or = [
                {
                    orderId: { $regex: search, $options: "i" }
                },
                {
                    userId: {
                        $in: users.map(user => user._id)
                    }
                }
            ]
        }


        if (status && status !== "All") {
            query.orderStatus = status
        }

        const skip = (page - 1) * limit

        let sortOption = { createdAt: -1 }

        if (sort === "oldest") {
            sortOption = { createdAt: 1 }
        } else if (sort === "amountHigh") {
            sortOption = { grandTotal: -1 }
        } else if (sort === "amountLow") {
            sortOption = { grandTotal: 1 }
        }


        const [orders, totalOrders] = await Promise.all([
            Order.find(query)
                .populate("userId", "firstName lastName email")
                .populate("items.productId", "productName variants")
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),

            Order.countDocuments(query)
        ])

        const totalPages = Math.ceil(totalOrders / limit)


        const stats = await Order.aggregate([
            {
                $group: {
                    _id: "$orderStatus",
                    count: { $sum: 1 }
                }
            }
        ])

        const orderStats = {
            totalOrders: 0,
            pendingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0

        }
        stats.forEach(item => {
            orderStats.totalOrders += item.count

            switch (item._id) {
                case "Pending":
                    orderStats.pendingOrders = item.count
                    break
                case "Shipped":
                    orderStats.shippedOrders = item.count
                    break
                case "Delivered":
                    orderStats.deliveredOrders = item.count
                    break
                case "Cancelled":
                    orderStats.cancelledOrders = item.count
                    break
            }
        })

        return {
            orders,
            totalOrders,
            totalPages,
            stats: orderStats
        }

    } catch (error) {
        console.log("Get orders service admin error", error)
    }
}




export const getOrderDetails = async (orderId) => {
    try {
        const order = await Order.findById(orderId).populate("userId", "firstName lastName email phone")
            .populate("items.productId", "productName variants")
            .lean()
        return order
    } catch (error) {
        console.log("Get orders details admin error", error)
    }
}

export const updateOrderStatus = async (orderId, status) => {
    try {

        const order = await Order.findById(orderId)

        if (!order) {
            return {
                success: false,
                message: "Order not found"
            }
        }

        const allowedTransitions = {
            Pending: ["Confirmed", "Cancelled"],
            Confirmed: ["Shipped", "Cancelled"],
            Shipped: ["Delivered"],
            Delivered: ["Returned"],
            Cancelled: [],
            Returned: []
        }

        const currentStatus = order.orderStatus

        if (currentStatus === status) {

            return {

                success: false,

                message: "Order is already in this status"

            }

        }

        if (!allowedTransitions[currentStatus].includes(status)) {
            return {
                success: false,
                message: "invalid status transition"
            }
        }
        order.orderStatus = status
        order.items.forEach(item => {
            if(["Cancelled","Returned","Return Requested"].includes(item.status)) return
            item.status = status

        })

        switch (status) {
            case "Confirmed": order.confirmedAt = new Date()
                order.timeline.push({
                    status: "Confirmed",
                    message: "Order confirmed by admin"
                })
                break

            case "Shipped": order.shippedAt = new Date()
                order.timeline.push({
                    status: "Shipped",
                    message: "Order has been Shipped"
                })
                break

            case "Delivered": order.deliveredAt = new Date()
                order.paymentStatus = "Paid"
                order.timeline.push({
                    status: "Delivered",
                    message: "Order delivered successfuly"
                })
                break

            case "Cancelled": order.cancelledAt = new Date()
                order.timeline.push({
                    status: "Cancelled",
                    message: "Order cancelled"
                })
                for (const item of order.items) {
                    const product = await Product.findById(item.productId)
                    if (!product) continue

                    const variant = product.variants.id(item.variantId)
                    if (!variant) continue

                    const size = variant.sizes.find(s => s.size === item.size)
                    if (!size) continue
                    if (item.status === "Cancelled") continue
                    size.stock += item.quantity
                    await product.save()
                }
                break

            case "Returned": order.returnedAt = new Date()
                order.refundStatus = "Pending"
                order.timeline.push({
                    status: "Returned",
                    message: "Order Returned"
                })
                break
        }



        await order.save()

        return {
            success: true,
            message: "Order status updated successfully"
        }

    } catch (error) {
        console.log("update order status admin error", error)
        return {
            success: false,
            message: "Something went wrong"
        }
    }

}




export const approveReturnService = async (orderId, itemId) => {

    try {

        const order = await Order.findById(orderId)

        if (!order) {
            return {
                success: false,
                message: "Order not found"
            }
        }

        const item = order.items.id(itemId)

        if (!item) {
            return {
                success: false,
                message: "Product not found"
            }
        }

        if (item.status !== "Return Requested") {
            return {
                success: false,
                message: "No return request found"
            }
        }

        item.status = "Returned"
        item.returnApprovedAt = new Date()

        const product = await Product.findById(item.productId)

        if (product) {

            const variant = product.variants.id(item.variantId)
            if (variant) {

                const size = variant.sizes.find(
                    s => s.size === item.size
                )
                if (size) {

                    size.stock += item.quantity
                }
            }
            await product.save()
        }

        order.refundStatus = "Pending"

        order.timeline.push({
            status: "Returned",
            message: `${item.productName} return approved.`
        })

       
         const hasPendingReturns = order.items.some(
            item => item.status === "Return Requested"
        )

        if (!hasPendingReturns) {

            const allReturned = order.items.every(
                item => item.status === "Returned"
            );

            if (allReturned) {
                order.orderStatus = "Returned";
                order.returnedAt = new Date();
            } else {
                order.orderStatus = "Delivered";
            }
        

        if (allReturned) {
            order.orderStatus = "Returned"
            order.returnedAt = new Date()
        }
    }

        await order.save()

        return {
            success: true,
            message: "Return approved successfully"
        }

    } catch (error) {
        console.log("approve return service error", error)
        return {

            success: false,
            message: "Something went wrong"

        }

    }

}

export const rejectReturnService = async ( orderId, itemId, reason) => {

    try {

        const order = await Order.findById(orderId)
        if (!order) {
            return {
                success: false,
                message: "Order not found"
            }
        }
        const item = order.items.id(itemId)

        if (!item) {
            return {
                success: false,
                message: "Product not found"
            }
        }

        if (item.status !== "Return Requested") {
            return {
                success: false,
                message: "No return request found"
            }
        }

        item.status = "Delivered"
        item.returnRejected = true
        item.returnRejectedAt = new Date()
        item.returnRejectReason = reason
        order.timeline.push({
            status: "Return Rejected",
            message: `${item.productName} return rejected. Reason: ${reason}`
        })

        const pendingReturns = order.items.some(
            item => item.status === "Return Requested"
        )

        if (!pendingReturns) {
            order.orderStatus = "Delivered"
        }

        await order.save()

        return {
            success: true,
            message: "Return request rejected"
        }

    } catch (error) {
        console.log("reject return service error", error)

        return {
            success: false,
            message: "Something went wrong"

        }

    }

}