import Cart from "../models/cartModel.js"
import Wishlist from "../models/wishlistModel.js"

export const navbarCounts = async (req, res, next) => {

    if (!req.user) {
        res.locals.cartCount = 0
        res.locals.wishlistCount = 0
        return next();
    }

    const cart = await Cart.findOne({ userId: req.user._id })
    const wishlist = await Wishlist.findOne({ userId: req.user._id })

    res.locals.cartCount = cart? cart.items.reduce((sum, item) => sum + item.quantity, 0): 0

    res.locals.wishlistCount = wishlist? wishlist.products.length: 0

    next()
}