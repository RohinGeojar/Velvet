import Wishlist from "../models/wishlistModel.js"

export const getValidWishlistCount = async (userId) => {

    const wishlist = await Wishlist.findOne({ userId })
        .populate({
            path: "products.productId",
            populate: {
                path: "category"
            }
        })

    if (!wishlist) return 0

    return wishlist.products.filter(item => {

        const product = item.productId

        if (!product) return false

        const variant = product.variants.id(item.variantId)

        return (
            variant &&
            product.isActive &&
            !product.isDeleted &&
            product.category &&
            product.category.isActive &&
            !product.category.isDeleted
        )

    }).length
}