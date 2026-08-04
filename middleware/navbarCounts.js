// import Cart from "../models/cartModel.js"
// import Wishlist from "../models/wishlistModel.js"

// export const navbarCounts = async (req, res, next) => {
// console.log("req.user:", req.user);
// console.log("session.user:", req.session.user);
//     if (!req.user) {
//         res.locals.cartCount = 0
//         res.locals.wishlistCount = 0
//         return next();
//     }

//     const cart = await Cart.findOne({ userId: req.user._id })
//     const wishlist = await Wishlist.findOne({ userId: req.user._id })

//     res.locals.cartCount = cart? cart.items.reduce((sum, item) => sum + item.quantity, 0): 0

//     res.locals.wishlistCount = wishlist? wishlist.products.length: 0

//     next()
// }
import Cart from "../models/cartModel.js"
import Wishlist from "../models/wishlistModel.js"

export const navbarCounts = async (req, res, next) => {
    try {
        const userId = req.session.user

        console.log("Session User:", userId)

        if (!userId) {
            res.locals.cartCount = 0
            res.locals.wishlistCount = 0
            return next()
        }

        const cart = await Cart.findOne({ userId })
        const wishlist = await Wishlist.findOne({ userId })

        console.log("Cart:", cart);
        console.log("Wishlist:", wishlist)

        res.locals.cartCount = cart
            ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
            : 0;

        res.locals.wishlistCount = wishlist
            ? wishlist.products.length
            : 0;

       

        next();

    } catch (err) {
        console.error(" counter middleware error",err)

        res.locals.cartCount = 0
        res.locals.wishlistCount = 0
        next()
    }
}