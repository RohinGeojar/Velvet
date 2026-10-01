import Cart from "../models/cartModel.js"
import Wishlist from "../models/wishlistModel.js"

export const navbarCounts = async (req, res, next) => {
    try {

        const userId = req.session.user

        if (!userId) {
            res.locals.cartCount = 0
            res.locals.wishlistCount = 0
            return next()
        }

        const cart = await Cart.findOne({ userId })

        const wishlist = await Wishlist.findOne({ userId })
            .populate({
                path: "products.productId",
                populate: {
                    path: "category"
                }
            })

        res.locals.cartCount = cart
            ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
            : 0

        let wishlistCount = 0

        if (wishlist) {

            wishlistCount = wishlist.products.filter(item => {

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

        res.locals.wishlistCount = wishlistCount

        next()

    } catch (err) {

        console.error("counter middleware error", err)

        res.locals.cartCount = 0
        res.locals.wishlistCount = 0

        next()
    }
}