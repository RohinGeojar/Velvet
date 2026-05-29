import express from "express";
import { userAuth } from "../../middleware/auth.js";
import { addToCart, loadCart, loadProductDetails, loadShop, removeCartItem } from "../../controllers/user/shopController.js";

const router = express.Router();




router.get("/", loadShop)
router.get("/product/:slug", loadProductDetails)

router.get("/cart",userAuth,loadCart)

router.post("/cart/add",userAuth, addToCart)


// router.patch("/cart/updateQuantity")

// router.delete("/cart/remove/:productId")
// router.patch("/cart/update-quantity", updateCartQuantity)
router.delete("/cart/remove/:productId", removeCartItem)

export default router