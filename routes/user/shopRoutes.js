import express from "express";
import { userAuth } from "../../middleware/auth.js";
import { addToCart, checkout, clearCart, loadCart, loadProductDetails, loadShop, loadWishlist, orderStatus, placeOrder, removeCartItem, removeWishlistItem, toggleWishlist, updateCartQuantity } from "../../controllers/user/shopController.js";
import { navbarCounts } from "../../middleware/navbarCounts.js";

const router = express.Router();


router.use(navbarCounts)
router.get("/", loadShop)
router.get("/product/:slug",userAuth, loadProductDetails)

router.get("/cart",userAuth,loadCart)
router.post("/cart/add",userAuth, addToCart)
router.delete("/cart/remove/:itemId",userAuth,removeCartItem)
router.patch("/cart/updateQuantity",userAuth, updateCartQuantity)
router.delete("/cart/clear",userAuth, clearCart)

// WISHLIST 

 router.get("/wishlist",userAuth,loadWishlist)
 router.post("/wishlist/toggle",userAuth,toggleWishlist)
 router.post("/wishlist/remove",userAuth,removeWishlistItem)

router.get("/checkout",userAuth,checkout)
router.post("/placeOrder",userAuth,placeOrder)

router.get("/orderSuccess",userAuth,orderStatus)
export default router