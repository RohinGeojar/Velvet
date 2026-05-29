import Cart from "../../models/cartModel.js"
import { AppError } from "../../utils/AppError.js"
import { STATUS } from "../../utils/statusCodes.js"
import Product from "../../models/productModel.js"

export const addingToCart = async (data) => {

    const { productId, variantIndex, size, quantity, userId } = data

    const product = await Product.findById(productId)

    if (!product) {
        throw new AppError("Product not found", STATUS.NOT_FOUND)
    }
    const variant = product.variants[variantIndex]

    if (!variant) {
        throw new AppError("Variant not found", STATUS.NOT_FOUND)
    }
    const selectedSize = variant.sizes.find(item => item.size === size)

    if (!selectedSize) {
        throw new AppError("Selected size not found", STATUS.NOT_FOUND)
    }

    if (selectedSize.stock < Number(quantity)) {
        throw new AppError("Insufficiant stock", STATUS.BAD_REQUEST)
    }

    let cart = await Cart.findOne({userId})

    if (!cart) {
        cart = new Cart({
            userId: userId,
            items: []
        })
    }
    if (Number(quantity) > 5) {

        throw new AppError("Maximum 5 quantity allowed", STATUS.BAD_REQUEST)
    }
    const existingItem = cart.items.find(item =>

        item.productId.toString() === productId.toString() &&

        item.variantIndex === Number(variantIndex) &&

        item.size === size
    )

    if (existingItem) {

        const newQuantity =

            existingItem.quantity +
            Number(quantity);

        if (newQuantity > 5) {
            throw new AppError("Maximum 5 quantity allowed", STATUS.BAD_REQUEST)
        }

        if (newQuantity > selectedSize.stock) {

            throw new AppError("Insufficient stock", STATUS.BAD_REQUEST)
        }

        existingItem.quantity = newQuantity;

    } else {

        cart.items.push({
            productId,
            variantIndex: Number(variantIndex),
            size,
            quantity: Number(quantity)
        })
    }
    await cart.save()

    return cart
}