import Offer from "../../models/offerModel.js"



export const calculateBestOffer = async (product, variantIndex = 0) => {
    try {

        const now = new Date()
        const variant = product.variants[variantIndex]

        if (!variant) return null

        const productOffer = await Offer.findOne({
            offerType: "product",
            products: product._id,
            isActive: true,
            isDeleted: false,
            startDate: { $lte: now },
            expiryDate: { $gte: now }
        })

        const categoryOffer = await Offer.findOne({
            offerType: "category",
            categories: product.category,
            isActive: true,
            isDeleted: false,
            startDate: { $lte: now },
            expiryDate: { $gte: now }
        })



        let appliedOffer = null
        let highestDiscount = 0

        const offers = [productOffer, categoryOffer].filter(Boolean)

        for (const offer of offers) {
            let discount = 0
            if (offer.discountType === "percentage") {
                discount = variant.salePrice * (offer.discountValue / 100)

                if (offer.maxDiscountAmount && discount > offer.maxDiscountAmount) {
                    discount = offer.maxDiscountAmount
                }

            } else {
                discount = offer.discountValue
            }
            if (discount > highestDiscount) {
                highestDiscount = discount
                appliedOffer = offer
            }
        }
        return {
            hasOffer: appliedOffer !== null,
            originalPrice: variant.salePrice,
            finalPrice: Math.max(0, Math.round(variant.salePrice - highestDiscount)),
            discountAmount: highestDiscount,
            discountPercentage: variant.salePrice > 0 ? Math.round(highestDiscount / variant.salePrice * 100) : 0,
            offerName: appliedOffer?.offerName || null,
            offerType: appliedOffer?.offerType || null,
            offerId: appliedOffer?._id || null

        }

    } catch (error) {
        console.log("calculate offer service error", error)
    }
}



