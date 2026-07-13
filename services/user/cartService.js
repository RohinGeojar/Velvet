import Cart from "../../models/cartModel.js"
import { AppError } from "../../utils/AppError.js"
import { STATUS } from "../../utils/statusCodes.js"
import Product from "../../models/productModel.js"

export const addingToCart = async (data) => {

    const { productId, variantIndex, size, quantity=1, userId } = data

    const product = await Product.findById(productId)
    await product.populate("category");

    if (!product || !product.isActive || product.isDeleted) {
        throw new AppError("Product is Unavailable", STATUS.NOT_FOUND)
    }
    if (!product.category || !product.category.isActive || product.category.isDeleted) {
    throw new AppError("Product is unavailable", STATUS.BAD_REQUEST)
}
    const variant = product.variants[variantIndex]

    if (!variant) {
        throw new AppError("Variant not found", STATUS.NOT_FOUND)
    }
    const selectedSize = variant.sizes.find(s => s.size === size);

if (!selectedSize) {
    throw new AppError( "The selected size is no longer available.", STATUS.BAD_REQUEST)
}
if (selectedSize.stock <= 0) {
    throw new AppError("This size is currently out of stock.", STATUS.BAD_REQUEST)
}


   
    let cart = await Cart.findOne({userId})

    if (!cart) {
        cart = new Cart({
            userId: userId,
            items: []
        })
    }
   
    const existingItem = cart.items.find(item =>

        item.productId.toString() === productId.toString() &&

        item.variantIndex === Number(variantIndex) &&

        item.size === size
    )
    const cartQuantity = existingItem?.quantity ||0

    if(cartQuantity+ Number(quantity) >selectedSize.stock){
        throw new AppError(`Maximum 5 quantities allowed per product.`, STATUS.BAD_REQUEST)
    }

    if (existingItem) {

    const newQuantity =
        existingItem.quantity +
        Number(quantity);

    if (newQuantity > selectedSize.stock) {

        throw new AppError(
            `Only ${selectedSize.stock} items available`,
            STATUS.BAD_REQUEST
        );
    }

    existingItem.quantity =
        newQuantity;

} else {

    if (
        Number(quantity) >
        selectedSize.stock
    ) {

        throw new AppError(
            `Only ${selectedSize.stock} items available`,
            STATUS.BAD_REQUEST
        );
    }

    cart.items.push({
        productId,
        variantIndex: Number(variantIndex),
        size,
        quantity: Number(quantity)
    });
}
    await cart.save()

    return cart
}