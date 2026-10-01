import Cart from "../../models/cartModel.js"
import { AppError } from "../../utils/AppError.js"
import { STATUS } from "../../utils/statusCodes.js"
import Product from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"
import { calculateBestOffer } from "./OfferCalculationService.js"



export const addingToCart = async (data) => {

    const { productId, variantIndex, size, quantity = 1, userId } = data

    const product = await Product.findById(productId).populate("category")

    if (!product || !product.isActive || product.isDeleted) {
        throw new AppError("This Product is currently Unavailable", STATUS.BAD_REQUEST)
    }
    if (!product.category || !product.category.isActive || product.category.isDeleted) {
        throw new AppError("This product is currently unavailable.", STATUS.BAD_REQUEST)
    }
    const variant = product.variants[variantIndex]

    if (!variant) {
        throw new AppError("Selected variant is unavailable.", STATUS.BAD_REQUEST)
    }
    const selectedSize = variant.sizes.find(s => s.size === size)

    if (!selectedSize) {
        throw new AppError("Selected size is unavailable.", STATUS.BAD_REQUEST)
    }
    if (selectedSize.stock <= 0) {
        throw new AppError("This size is currently out of stock.", STATUS.BAD_REQUEST)
    }



    let cart = await Cart.findOne({ userId })

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


    const currentQty = existingItem ? existingItem.quantity : 0

    const newQuantity = currentQty + Number(quantity)

    if (newQuantity > 5) {
        throw new AppError("Maximum 5 quantities allowed per product.", STATUS.BAD_REQUEST)
    }


    if (existingItem) {


        if (newQuantity > selectedSize.stock) {

            throw new AppError(`Only ${selectedSize.stock} items available`, STATUS.BAD_REQUEST)
        }

        existingItem.quantity = newQuantity

    } else {
        if (Number(quantity) > selectedSize.stock) {
        throw new AppError(
            `Only ${selectedSize.stock} items available.`,
            STATUS.BAD_REQUEST
        )
    }


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




export const updateCartQuantityService = async (userId, itemId, action,) => {

    const cart = await Cart.findOne({ userId })
    if (!cart) {
        throw new AppError("Cart not found.", STATUS.NOT_FOUND)
    }

    const item = cart?.items.find( item => item._id.toString() === itemId)

    if (!item) {
        throw new AppError("This item is no longer in your cart.", STATUS.BAD_REQUEST)
    }

    const product = await Product.findById(item.productId)

    if (!product || !product.isActive || product.isDeleted) {
        throw new AppError(
            "This Product is currerntly unavailable.",
            STATUS.BAD_REQUEST
        )
    }

    const category = await Category.findById(product.category)

    if (!category || !category.isActive || category.isDeleted) {
        throw new AppError(
            "This product is unavailable.",
            STATUS.BAD_REQUEST
        )
    }

    const variant = product.variants[item.variantIndex]

    if (!variant) {
        throw new AppError(
            "Selected variant is unavailable.",
            STATUS.BAD_REQUEST
        )
    }

    const sizeObj = variant.sizes.find(
        s => s.size === item.size
    )

    if (!sizeObj) {
        throw new AppError(
            "Selected size is unavailable.",
            STATUS.BAD_REQUEST
        )
    }
    const availableStock = sizeObj.stock
    let newQuantity = item.quantity

    if (action === "decrement") {
        if (item.quantity === 1) {
            throw new AppError("Minimum quantity is 1.", STATUS.BAD_REQUEST)
        }
        newQuantity--
    }

    if (action === "increment") {
        newQuantity++
        if (newQuantity > availableStock) {
            throw new AppError(
                `Only ${availableStock} items available.`,
                STATUS.BAD_REQUEST
            )
        }
        if (newQuantity > 5) {
            throw new AppError(
                "Maximum 5 quantities allowed per product.",
                STATUS.BAD_REQUEST
            )
        }
    }

    item.quantity = newQuantity

    await cart.save()

    let originalTotal = 0
    let offerDiscount = 0
    let subtotal = 0


    let itemTotal = 0
    let originalItemTotal = 0
    let cartCount = 0

    for (const cartItem of cart.items) {

        cartCount += cartItem.quantity

        const product = await Product.findById(cartItem.productId)

        if (!product || !product.isActive || product.isDeleted)
            continue

        const category = await Category.findById(product.category)

        if (!category || !category.isActive || category.isDeleted)
            continue

        const variant = product.variants[cartItem.variantIndex]

        if (!variant)
            continue

        const size = variant.sizes.find(
            s => s.size === cartItem.size
        )

        if (!size || size.stock <= 0)
            continue

        const offer = await calculateBestOffer(product, cartItem.variantIndex)

        const originalPrice = variant.salePrice

        const finalPrice = offer.hasOffer
            ? offer.finalPrice
            : originalPrice

        originalTotal += originalPrice * cartItem.quantity

        offerDiscount += (originalPrice - finalPrice) * cartItem.quantity

        subtotal += finalPrice * cartItem.quantity

        if (cartItem._id.toString() === itemId.toString()) {
            itemTotal = finalPrice * cartItem.quantity
            originalItemTotal = originalPrice * cartItem.quantity
        }
    }



    const shipping = subtotal > 999 ? 0 : 99

    const grandTotal = subtotal + shipping


    return {
        success: true,
        quantity: newQuantity,
        itemTotal,
        originalItemTotal,
        cartCount,
        originalTotal,
        offerDiscount,
        subtotal,
        shipping,
        grandTotal
    }

}


export const removeCartItemService = async (
    userId,
    itemId,
    
) => {

    const cart = await Cart.findOneAndUpdate(
        { userId },
        {
            $pull: {
                items: {
                    _id: itemId
                }
            }
        },
        { returnDocument: 'after' }
    ).populate("items.productId")

    if (!cart) {
        throw new AppError(
            "Cart not found.",
            STATUS.NOT_FOUND
        )
    }

    let originalTotal = 0
    let offerDiscount = 0
    let subtotal = 0
    let cartCount = 0

    for (const cartItem of cart.items) {

        cartCount += cartItem.quantity

        const product = cartItem.productId

        if (!product || !product.isActive || product.isDeleted)
            continue

        const category = await Category.findById(product.category)

        if (!category || !category.isActive || category.isDeleted)
            continue

        const variant = product.variants[cartItem.variantIndex]

        if (!variant)
            continue

        const size = variant.sizes.find(
            s => s.size === cartItem.size
        )

        if (!size || size.stock <= 0)
            continue

        const offer = await calculateBestOffer(product, cartItem.variantIndex)

        const originalPrice = variant.salePrice

        const finalPrice = offer.hasOffer
            ? offer.finalPrice
            : originalPrice

        originalTotal += originalPrice * cartItem.quantity

        offerDiscount += (originalPrice - finalPrice) * cartItem.quantity

        subtotal += finalPrice * cartItem.quantity
    }

  

    const shipping = subtotal > 999 ? 0 : 99
    const grandTotal = subtotal  + shipping

    return {

        success: true,
        cartCount,
        originalTotal,
        offerDiscount,
        subtotal,
        shipping,
        grandTotal,
        isEmpty: cart.items.length === 0
    }
}