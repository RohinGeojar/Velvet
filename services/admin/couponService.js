
import Coupon from "../../models/couponModel.js"


export const createCouponService = async (data) => {

    try {
        const existingCoupon = await Coupon.findOne({ couponCode: data.couponCode })
        if (existingCoupon) {
            return {
                success: false,
                message: "Coupon already exist"
            }
        }
        const coupon = await Coupon.create(data)

        return {
            success: true,
            coupon
        }
    } catch (error) {
        console.log("Create coupon service error", error)

    }
}


export const getCouponService = async ({ page = 1, limit = 3, search = "", status = "", discountType = "", sort = "latest" }) => {
    try {

        const query = { isDeleted: false }
        const today = new Date()


        if (search) {
            query.$and = [
                {
                    $or: [
                        { couponCode: { $regex: search, $options: "i" } },
                        { couponName: { $regex: search, $options: "i" } }
                    ]
                }
            ]
        }
        if (status === "active") {

            query.isActive = true;
            query.isDeleted = false;
            query.startDate = { $lte: today }
            query.expiryDate = { $gte: today }

        }
        else if (status === "blocked") {

            query.isActive = false;
            query.isDeleted = false;
            query.startDate = { $lte: today }
            query.expiryDate = { $gte: today }

        }
        else if (status === "expired") {

            query.isDeleted = false;
            query.expiryDate = { $lt: today }

        }
        else if (status === "deleted") {

            delete query.isDeleted
            query.isDeleted = true

        }
        else if (status === "upcoming") {

            query.isActive = true
            query.isDeleted = false
            query.startDate = { $gt: today }

        }


        if (discountType) {
            query.discountType = discountType
        }


        let sortOption = {}

        switch (sort) {

            case "a-z":
                sortOption = { couponCode: 1 }
                break;

            case "z-a":
                sortOption = { couponCode: -1 }
                break;

            case "expiry":
                sortOption = { expiryDate: 1 }
                break;

            case "oldest":
                sortOption = { createdAt: 1 }
                break;

            case "latest":
            default:
                sortOption = { createdAt: -1 }
        }

        const skip = (page - 1) * limit;
        const coupons = await Coupon.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)

        const activeCoupons = await Coupon.countDocuments({
            isActive: true,
            isDeleted: false,
            startDate: { $lte: today },
            expiryDate: { $gte: today }
        })
        const filteredCount = await Coupon.countDocuments(query)
        const totalCoupons = await Coupon.countDocuments(query)

        const totalPages = Math.ceil(filteredCount / limit)

        const blockedCoupons = await Coupon.countDocuments({
            isActive: false,
            isDeleted: false,
            startDate: { $lte: today },
            expiryDate: { $gte: today }
        })

        const deletedCoupons = await Coupon.countDocuments({
            isDeleted: true
        })

        const expiredCoupons = await Coupon.countDocuments({
            isDeleted: false,
            expiryDate: { $lt: today }
        })
        const upcomingCoupons = await Coupon.countDocuments({
            isActive: true,
            isDeleted: false,
            startDate: { $gt: today }
        })

        const totalUsedCoupons = coupons.reduce((total, coupon) => {
            return total + (coupon.usedCount || 0)
        }, 0)

        return {
            coupons,
            totalCoupons,
            activeCoupons,
            expiredCoupons,
            blockedCoupons,
            upcomingCoupons,
            deletedCoupons,
            totalUsedCoupons,
            currentPage: page,
            totalPages,
            limit,
            search,
            status,
            discountType,
            sort
        }
    } catch (error) {
        console.log("get coupon service error", error)

    }
}

export const updateCouponService = async (id, data) => {
    try {

        const existingCoupon = await Coupon.findOne({
            couponCode: data.couponCode,
            _id: { $ne: id }
        })

        if (existingCoupon) {
            return {
                success: false,
                message: "Coupon code already exists."
            }
        }

        const coupon = await Coupon.findByIdAndUpdate(
            id,
            data,
            {
                new: true,
                runValidators: true
            }
        )

        return {
            success: true,
            coupon
        }
    } catch (error) {
        console.log("Update coupon service error", error)
        return {
            success: true,
            message: "Something went wrong"
        }
    }
}


export const getCouponByIdService = async (id) => {
    return await Coupon.findById(id)
}


export const toggleCouponService = async (id) => {

    const coupon = await Coupon.findById(id)

    if (!coupon) return null

    coupon.isActive = !coupon.isActive

    await coupon.save()

    return coupon
}


export const deleteCouponService = async (id) => {

    const coupon = await Coupon.findById(id)

    if (!coupon) return null

    coupon.isDeleted = true

    await coupon.save()

    return coupon

}
export const restoreCouponService = async (id) => {

    const coupon = await Coupon.findById(id);

    if (!coupon) return null;

    coupon.isDeleted = false;

    await coupon.save();

    return coupon;

}