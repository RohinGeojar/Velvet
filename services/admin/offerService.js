import Offer from "../../models/offerModel.js"
import Product from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"

export const getCreateOfferData = async () => {

    const products = await Product
        .find({ isDeleted: false })
        .sort({ productName: 1 })

    const categories = await Category
        .find({ isDeleted: false })
        .sort({ name: 1 })

    return {
        products,
        categories
    }
}

export const getEditOfferData = async (offerId) => {

    const offer = await Offer
        .findById(offerId)
        .populate("products", "productName")
        .populate("categories", "name")

    if (!offer) {
        return null
    }

    const products = await Product
        .find({ isDeleted: false })
        .sort({ productName: 1 })

    const categories = await Category
        .find({ isDeleted: false })
        .sort({ name: 1 })

    return {
        offer,
        products,
        categories
    }
}


export const createOfferService = async (offerData, offerName) => {

    const offer = await Offer.create({
        offerName: offerName,
        description: offerData.description,
        offerType: offerData.offerType,
        products: offerData.offerType === "product" ? (offerData.products || []) : [],
        categories: offerData.offerType === "category" ? (offerData.categories || []) : [],
        discountType: offerData.discountType,
        discountValue: offerData.discountValue,
        maxDiscountAmount: offerData.maxDiscountAmount || null,
        startDate: offerData.startDate,
        expiryDate: offerData.expiryDate,
        isActive: offerData.isActive === "on" || offerData.isActive === true,
        isDeleted: false
    })

    return offer;

}


export const getOfferService = async ({
    page = 1,
    limit = 5,
    search = "",
    status = "",
    offerType = "",
    sort = "latest"
}) => {

    try {
        const skip = (page - 1) * limit

        let query = { isDeleted: false }

        query.offerType = offerType || "product"

        const today = new Date();
        today.setHours(0, 0, 0, 0);


        if (search.trim()) {

            const productIds = await Product.find({
                productName: { $regex: search, $options: "i" }
            }).distinct("_id")

            const categoryIds = await Category.find({
                name: { $regex: search, $options: "i" }
            }).distinct("_id")

            query.$or = [
                {
                    offerName: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    products: {
                        $in: productIds
                    }
                },
                {
                    categories: {
                        $in: categoryIds
                    }
                }
            ]
        }


        switch (status) {

            case "active":
                query.isDeleted = false
                query.isActive = true
                query.startDate = { $lte: today }
                query.expiryDate = { $gte: today }
                break

            case "upcoming":
                query.isDeleted = false
                query.isActive = true
                query.startDate = { $gt: today }
                break

            case "blocked":
                query.isDeleted = false
                query.isActive = false
                break

            case "expired":
                query.isDeleted = false
                query.expiryDate = { $lt: today }
                break

            case "deleted":
                delete query.isDeleted
                query.isDeleted = true
                break
        }


        let sortOption = {}

        switch (sort) {

            case "a-z":
                sortOption = { offerName: 1 }
                break

            case "z-a":
                sortOption = { offerName: -1 }
                break

            case "highest":
                sortOption = { discountValue: -1 }
                break

            case "lowest":
                sortOption = { discountValue: 1 }
                break

            case "start":
                sortOption = { startDate: -1 }
                break

            case "expiry":
                sortOption = { expiryDate: 1 }
                break

            default:
                sortOption = { createdAt: -1 }
        }

        const offers = await Offer.find(query)
            .populate("products", "productName")
            .populate("categories", "name")
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean()


        offers.forEach(offer => {

            const startDate = new Date(offer.startDate);
            startDate.setHours(0, 0, 0, 0)

            const expiryDate = new Date(offer.expiryDate);
            expiryDate.setHours(23, 59, 59, 999)

            if (offer.isDeleted) {
                offer.status = "Deleted";
            } else if (!offer.isActive) {
                offer.status = "Blocked";
            } else if (startDate > today) {
                offer.status = "Upcoming";
            } else if (expiryDate < today) {
                offer.status = "Expired";
            } else {
                offer.status = "Active";
            }

        })


        const totalOffers = await Offer.countDocuments(query)

        const totalPages = Math.ceil(totalOffers / limit)

        const dashboard = {

            total: await Offer.countDocuments(),

            active: await Offer.countDocuments({
                isDeleted: false,
                isActive: true,
                startDate: { $lte: today },
                expiryDate: { $gte: today }
            }),

            upcoming: await Offer.countDocuments({
                isDeleted: false,
                isActive: true,
                startDate: { $gt: today }
            }),

            blocked: await Offer.countDocuments({
                isDeleted: false,
                isActive: false
            }),

            expired: await Offer.countDocuments({
                isDeleted: false,
                expiryDate: { $lt: today }
            }),

            deleted: await Offer.countDocuments({
                isDeleted: true
            })
        }

        return {
            offers,
            currentPage: Number(page),
            totalPages,
            totalOffers,
            limit,
            dashboard,
            search,
            status,
            offerType,
            sort
        }
    } catch (error) {
        console.log("get offer service error", error)
    }
}



export const updateOfferService = async (id, offerData, offerName) => {

    return await Offer.findByIdAndUpdate(id, {
        offerName,
        description: offerData.description,
        offerType: offerData.offerType,

        products: offerData.offerType === "product" ? (offerData.products || []) : [],

        categories: offerData.offerType === "category" ? (offerData.categories || []) : [],

        discountType: offerData.discountType,
        discountValue: offerData.discountValue,

        maxDiscountAmount: offerData.discountType === "percentage" ? offerData.maxDiscountAmount : null,

        startDate: offerData.startDate,
        expiryDate: offerData.expiryDate,

        isActive: offerData.isActive === true || offerData.isActive === "on"
    },
        {
            new: true,
            runValidators: true
        }
    )

}







export const toggleOfferservice = async (id) => {
    try {

        const offer = await Offer.findById(id)

        if (!offer) return null

        offer.isActive = !offer.isActive

        await offer.save()

        return offer

    } catch (error) {
        console.log("Toggle offer service error", error)
    }
}


export const deleteOfferservice = async (id) => {
    try {
        const offer = await Offer.findByIdAndUpdate(id,
            {
                isDeleted: true
            },
            {
                new: true
            }
        )


    } catch (error) {
        console.log("delete offer service error", error)
    }
}

export const restoreOfferservice = async (id) => {
    try {
        const offer = await Offer.findByIdAndUpdate(id,
            {
                isDeleted: false
            },
            {
                new: true
            }
        )
    } catch (error) {
        console.log("restore offer service error", error)
    }
}



