import Order from "../../models/order.js"
import Product from "../../models/productModel.js"
import User from "../../models/user.js"
import Offer from "../../models/offerModel.js"

const excludedStatuses = ["Cancelled", "Returned"]

const getDateRange = (filter, startDate, endDate) => {
    const now = new Date()
    let start
    let end

    if (filter === "custom") {
        start = new Date(startDate)
        end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
    } else if (filter === "daily") {
        start = new Date(now)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setHours(23, 59, 59, 999)
    } else if (filter === "weekly") {
        start = new Date(now)
        start.setDate(now.getDate() - 6)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setHours(23, 59, 59, 999)
    } else if (filter === "monthly") {
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else {
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    }

    return { start, end }
}

const getSalesData = async (filter, start, end) => {
    let groupId

    if (filter === "daily") {
        groupId = { hour: { $hour: "$createdAt" } }
    } else if (filter === "weekly" || filter === "custom") {
        groupId = {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
        }
    } else if (filter === "monthly") {
        groupId = { day: { $dayOfMonth: "$createdAt" } }
    } else {
        groupId = { month: { $month: "$createdAt" } }
    }

    const result = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: "$items" },
        { $match: { "items.status": { $nin: excludedStatuses } } },
        {
            $group: {
                _id: groupId,
                sales: { $sum: "$items.finalTotal" }
            }
        },
        { $sort: { "_id": 1 } }
    ])

    if (filter === "yearly") {
        return Array.from({ length: 12 }, (_, i) => {
            const data = result.find(item => item._id.month === i + 1)

            return {
                label: new Date(2000, i).toLocaleString("en-US", { month: "short" }),
                sales: data ? data.sales : 0
            }
        })
    }

    if (filter === "monthly") {
        const days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()

        return Array.from({ length: days }, (_, i) => {
            const data = result.find(item => item._id.day === i + 1)

            return {
                label: String(i + 1),
                sales: data ? data.sales : 0
            }
        })
    }

    if (filter === "daily") {
        return Array.from({ length: 24 }, (_, i) => {
            const data = result.find(item => item._id.hour === i)

            return {
                label: `${String(i).padStart(2, "0")}:00`,
                sales: data ? data.sales : 0
            }
        })
    }

    if (filter === "weekly") {
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(start)
            date.setDate(start.getDate() + i)

            const data = result.find(item =>
                item._id.year === date.getFullYear() &&
                item._id.month === date.getMonth() + 1 &&
                item._id.day === date.getDate()
            )

            return {
                label: date.toLocaleString("en-US", { weekday: "short" }),
                sales: data ? data.sales : 0
            }
        })
    }

    return result.map(item => ({
        label: `${item._id.day}/${item._id.month}/${item._id.year}`,
        sales: item.sales
    }))
}

 export const getBestSellingProducts = async () => {
    return await Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.status": { $nin: excludedStatuses } } },
        {
            $group: {
                _id: "$items.productId",
                totalSold: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.finalTotal" }
            }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $project: {
                _id: 1,
                productName: "$product.productName",
                totalSold: 1,
                revenue: 1
            }
        }
    ])
}

const getBestSellingCategories = async () => {
    return await Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.status": { $nin: excludedStatuses } } },
        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $group: {
                _id: "$product.category",
                totalSold: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.finalTotal" }
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "category"
            }
        },
        { $unwind: "$category" },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        {
            $project: {
                _id: 1,
                categoryName: "$category.name",
                totalSold: 1,
                revenue: 1
            }
        }
    ])
}



const getRecentOrders = async () => {
    return await Order.aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                orderId: 1,
                userId: {
                    firstName: "$user.firstName",
                    lastName: "$user.lastName"
                },
                grandTotal: 1,
                paymentStatus: 1
            }
        }
    ])
}

const getDashboardStats = async () => {
    const [revenue, orders, products, users, activeOffers] = await Promise.all([
        Order.aggregate([
            { $unwind: "$items" },
            { $match: { "items.status": { $nin: excludedStatuses } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$items.finalTotal" }
                }
            }
        ]),
        Order.countDocuments(),
        Product.countDocuments({ isDeleted: false,isActive :true }),
        User.countDocuments({ role: { $ne: "admin" } ,isBlocked:false}),
        Offer.countDocuments({ isDeleted: false, isActive: true })
    ])

    return {
        totalRevenue: revenue[0]?.total || 0,
        totalOrders: orders,
        totalProducts: products,
        totalUsers: users,
        activeOffers
    }
}

export const getDashboardDataService = async (filter, startDate, endDate) => {
    const { start, end } = getDateRange(filter, startDate, endDate)

    const [salesData, bestProducts, bestCategories, recentOrders, summaryStats] = await Promise.all([
        getSalesData(filter, start, end),
        getBestSellingProducts(),
        getBestSellingCategories(),
        getRecentOrders(),
        getDashboardStats()
    ])

    return {
        salesData,
        bestProducts,
        bestCategories,
        recentOrders,
        summaryStats: {
            ...summaryStats,
            recentOrders
        }
    }
}

