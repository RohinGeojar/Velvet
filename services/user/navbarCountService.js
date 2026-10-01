import Wishlist from "../../models/wishlistModel.js"

export const getWishlistCountService = async (userId) => {
    const wishlist = await Wishlist.findOne({ userId })
        .populate({
            path: "products.productId",
            populate: {
                path: "category"
            }
        })

    if (!wishlist) {
        return 0
    }

    return wishlist.products.filter(item => {

        const product = item.productId

        if (!product) return false

        const variant = product.variants.id(item.variantId)

        if (!variant) return false

        if (!product.isActive || product.isDeleted) {
            return false
        }

        if (
            !product.category ||
            !product.category.isActive ||
            product.category.isDeleted
        ) {
            return false
        }

        return true

    }).length
}