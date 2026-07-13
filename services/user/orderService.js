
import Order from "../../models/order.js"
import Product from "../../models/productModel.js"


export const createOrder = async (userId, cart, orderItems, subtotal, grandTotal, shipping, paymentMethod, address) => {

    const order = await Order.create({
        userId: userId,
        orderId: `#VVORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        items: orderItems,

        shippingAddress: {
            name: address.name,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            landmark: address.landmark,
            city: address.city,
            country: address.country,
            postalCode: address.postalCode

        },

        paymentMethod,
        paymentStatus: "Pending",
        orderStatus: "Pending",
        subtotal,
        shippingCharge: shipping,
        ProductDiscount: 0,
        couponDiscount: 0,
        grandTotal: Math.round(grandTotal),
        couponCode: null
    })



    for (const item of cart.items) {

        const product = await Product.findById(item.productId._id)


        const variant = product.variants[item.variantIndex]

        const sizeData = variant.sizes.find(
            s => s.size === item.size
        )

        sizeData.stock -= item.quantity
        await product.save()

    }



    cart.items = []
    await cart.save()


    return order
}


export const getOrders = async (userId, queryParams) => {
    try {
        const page = Number(queryParams.page) || 1
        const limit = 5
        const skip = (page - 1) * limit

        const search = queryParams.search?.trim() || ""
        const query = {
            userId
        }

        if (search) {
            query.$or = [
                {
                    orderId: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    "items.productName": {
                        $regex: search,
                        $options: "i"
                    }
                }
            ]
        }

        const [orders, totalOrders] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Order.countDocuments(query)
        ])

        return {
            orders,
            currentPage: page,
            totalPage: Math.ceil(totalOrders / limit),
            totalOrders,
            search
        }
    } catch (error) {
        console.log("get orders service error: =>", error)
    }
}


export const cancelProduct = async (orderId, itemId, userId, reason) => {
    try {

        const order = await Order.findOne({ _id: orderId, userId })

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
                message: "Product mot found"
            }
        }

        if (!["Pending", "Confirmed"].includes(item.status)) {
            return {
                success: false,
                message: "This product cannot be cancelled"
            }
        }

        item.status = "Cancelled"

        item.cancelReason = reason

        const product = await Product.findById(item.productId)

        if (product) {
            const variant = product.variants.id(item.variantId)

            if (variant) {
                const size = variant.sizes.find(s => s.size === item.size)

                if (size) {
                    size.stock += item.quantity
                }
            }
            await product.save()
        }

        const activeitems = order.items.filter(item => item.status !== "Cancelled")
        order.timeline.push({
            status: "Cancelled",
            message: `${item.productName} cancelled. Reason ${reason}.`
        })
        if (activeitems.length === 0) {
            order.orderStatus = "Cancelled"

            order.cancelledAt = new Date()
            order.timeline.push({

                status: "Order Cancelled",

                message: "All products in the order were cancelled."

            })
            order.subtotal = 0
            order.productDiscount = 0
            order.couponDiscount = 0
            order.grandTotal = 0
            order.shippingCharge = 0
        } else {

            order.subtotal = activeitems.reduce((total, item) => {
                return total + item.total
            }, 0)
            const FREE_SHIPPING_LIMIT = 999

            if (order.subtotal >= FREE_SHIPPING_LIMIT) {

                order.shippingCharge = 0

            } else {

                order.shippingCharge = 99

            }

            order.grandTotal = order.subtotal - order.productDiscount - order.couponDiscount + order.shippingCharge

            if (order.grandTotal < 0) {
                order.grandTotal = 0
            }
        }



        await order.save()
        return {
            success: true,
            message: "Product cancelled successfully"
        }

    } catch (error) {
        console.log("cancel product service error", error)
        return {

            success: false,

            message: "Something went wrong"

        }
    }
}


export const cancelWholeOrder = async (orderId, userId, reason) => {
    try {

        const order = await Order.findOne({ _id: orderId, userId })

        if (!order) {
            return {
                success: false,
                message: "Order not found"
            }
        }

        if (!["Pending", "Confirmed"].includes(order.orderStatus)) {
            return {
                success: false,
                message: "This order cannot be canelled"
            }
        }

        for (const item of order.items) {
            if (item.status === 'Cancelled') {
                continue
            }
            item.status = "Cancelled"
            item.cancelReason = reason
            order.timeline.push({

                status: "Cancelled",
                message: `${item.productName} cancelled. Reason: ${reason}`

            })

            const product = await Product.findById(item.productId)

            if (product) {
                const variant = product.variants.id(item.variantId)

                if (variant) {
                    const size = variant.sizes.find(s => s.size === item.size)

                    if (size) {
                        size.stock += item.quantity
                    }
                }
                await product.save()
            }
        }

        order.orderStatus = "Cancelled"

        order.cancelledAt = new Date()
        order.subtotal = 0
        order.productDiscount = 0
        order.couponDiscount = 0
        order.shippingCharge = 0
        order.grandTotal = 0

        order.timeline.push({
            status: "Order Cancelled",
            message: `Entire order cancelled. Reason: ${reason}`
        })

        await order.save()
        return {
            success: true,
            message: "Order cancelled successfully"
        }

    } catch (error) {
        console.log("cancel whole order service error", error)
        return {

            success: false,

            message: "Something went wrong"

        }
    }
}


export const requestReturnService = async (orderId,itemId,userId,reason) => {
    try {
        
        const order = await Order.findOne({
            _id:orderId,userId
        })

        if(!order){
            return{
                success:false,
                message:"Order not Found"
            }
        }


        const item = order.items.id(itemId)

        if(!item){
            return {
                success:false,
                message:"Product not found"
            }
        }

        if(item.status !== "Delivered"){
            return{
                success:false,
                message:"Only delivered products can be returned"
            }
        }
        
        item.status = "Return Requested"
        item.returnReason = reason
        item.returnRequestedAt = new Date() 

        order.timeline.push({
            status:"Return Requested",
            message:`return requested for ${item.ProductName}. Reason : ${reason}`
        })
        if(order.items.some(i=>i.status === "Return Requested")){
            order.orderStatus = "Return Requested"
        }

        await order.save()

        return{
            success:true,
            message:"Return request submitted"
        }


    } catch (error) {
        console.log("return request service error", error)
        return {

            success: false,

            message: "Something went wrong"

        }
    }
}