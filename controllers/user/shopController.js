import mongoose from "mongoose"
import Category from "../../models/categoryModel.js"
import Product from "../../models/productModel.js"
import Cart from "../../models/cartModel.js"
import Wishlist from "../../models/wishlistModel.js"
import Address from "../../models/address.js"
import { AppError } from "../../utils/AppError.js"
import { addingToCart, removeCartItemService } from "../../services/user/cartService.js"
import * as addressService from "../../services/user/addressService.js"
import { addressSchema } from "../../validators/addressValidator.js"
import { capitalizeName, normalizeText } from "../../utils/capitalizer.js"
import { createOrder } from "../../services/user/orderService.js"
import Order from "../../models/order.js"
import { updateCartQuantityService } from "../../services/user/cartService.js"
import { calculateBestOffer } from "../../services/user/OfferCalculationService.js"
import { calculateCouponDiscount, validateCoupon, markCouponUsed } from "../../services/user/couponService.js"
import razorpay from "../../config/razorpay.js"
import crypto from "crypto"
import { getWalletService, debitWalletService } from "../../services/user/walletService.js"
import { getWishlistCountService } from "../../services/user/navbarCountService.js"
import { MESSAGES } from "../../utils/messages.js"
import { STATUS } from "../../utils/statusCodes.js"


export const loadShop = async (req, res) => {

    try {


        const {
            search = "",
            category = "",
            sort = "",
            minPrice = "",
            maxPrice = "",
            size = "",
            color = "",
            stock = "",
            page = 1
        } = req.query

        const currentPage = Number(page) || 1

        const limit = 9
        const skip = (currentPage - 1) * limit

        let query = {
            isActive: true,
            isDeleted: false
        }

        const selectedCategory =
            await Category.findOne({
                slug: category
            })

        if (selectedCategory) {

            query.category =
                selectedCategory._id
        }
        const categories = await Category.find({
            isActive: true,
            isDeleted: false
        })

        const normalizedSearch = search
            .toLowerCase()
            .replace(/[\s-]/g, "")

        const matchedCategories = categories.filter(category => {
            const normalizedName =
                category.name
                    .toLowerCase()
                    .replace(/[\s-]/g, "")

            const normalizedSlug =
                category.slug
                    .toLowerCase()
                    .replace(/[\s-]/g, "")
            return (normalizedName.includes(normalizedSearch) || normalizedSlug.includes(normalizedSearch))
        })
        if (search.trim()) {

            query.$or = [
                {
                    productName: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ]

            if (matchedCategories.length) {

                query.$or.push({

                    category: {

                        $in: matchedCategories.map(
                            category => category._id
                        )
                    }
                })
            }
        }
        if (category && mongoose.Types.ObjectId.isValid(category)) {

            query.category = category
        }
        if (minPrice || maxPrice) {
            query["variants"] = {
                $elemMatch: {}
            }
            if (minPrice) {
                query["variants"].$elemMatch.salePrice = {
                    ...query["variants"].$elemMatch.salePrice,
                    $gte: Number(minPrice)
                }
            }
            if (maxPrice) {
                query["variants"].$elemMatch.salePrice = {
                    ...query["variants"].$elemMatch.salePrice,
                    $lte: Number(maxPrice)
                }
            }
        }


        if (size) {
            query["variants.sizes"] = {
                $elemMatch: {
                    size: size,
                    stock: { $gt: 0 }
                }
            }
        }
        if (stock === "inStock") {
            query["variants.sizes.stock"] = {
                $gt: 0
            }
        }
        if (stock === "outOfStock") {
            query["variants.sizes.stock"] = 0
        }
        let sortOption = {}

        switch (sort) {

            case "a_z":
                sortOption.productName = 1
                break

            case "z_a":
                sortOption.productName = -1
                break

            default:
                sortOption.createdAt = -1
        }


        const products = await Product.find(query)

            .populate({
                path: "category",
                match: {
                    isActive: true,
                    isDeleted: false
                }
            }).sort(sortOption)
            .lean()

        const [priceData] = await Product.aggregate([
            { $match: { isActive: true, isDeleted: false } },
            { $unwind: "$variants" },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$variants.salePrice" },
                    maxPrice: { $max: "$variants.salePrice" }
                }
            }
        ])

        let dbMinPrice = priceData.minPrice
        let dbMaxPrice = priceData.maxPrice


        const filteredProducts = products.filter(
            product => product.category
        )

        for (const product of filteredProducts) {

            let lowestPrice = Infinity
            let cheapestVariantIndex = 0

            for (let i = 0; i < product.variants.length; i++) {

                const offer = await calculateBestOffer(product, i)

                product.variants[i].offer = offer

                const finalPrice = offer.hasOffer
                    ? offer.finalPrice
                    : product.variants[i].salePrice

                if (finalPrice < lowestPrice) {
                    lowestPrice = finalPrice
                    cheapestVariantIndex = i
                }
            }

            product.displayPrice = lowestPrice
            product.defaultVariant = product.variants[cheapestVariantIndex]
        }

        if (sort === "price_asc") {
            filteredProducts.sort((a, b) => a.displayPrice - b.displayPrice)
        }
        if (sort === "price_desc") {
            filteredProducts.sort((a, b) => b.displayPrice - a.displayPrice)
        }
        if (sort === "a_z") {
            filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName))
        }
        if (sort === "z_a") {
            filteredProducts.sort((a, b) => b.productName.localeCompare(a.productName))
        }

        const totalProducts = filteredProducts.length
        const totalPages = Math.ceil(totalProducts / limit)
        const paginatedProducts = filteredProducts.slice(
            skip,
            skip + limit
        )
        const wishlist = await Wishlist.findOne({ userId: req.session.user })


        res.render("user/shop", {
            products: paginatedProducts,
            categories,
            wishlist,
            currentPage,
            totalPages,
            search,
            category,
            size,
            color,
            stock,
            sort,
            minPrice,
            maxPrice,
            dbMaxPrice,
            dbMinPrice,
            showNavbar: true,
            activeNav: "collection",

        })

    } catch (error) {

        console.log(error)

        res.redirect("/pageNotFound")
    }
}

export const loadProductDetails = async (req, res) => {
    try {
        const { slug } = req.params
        const product = await Product.findOne({ slug }).populate("category")

        if (!product ||!product.isActive) {
            return res.redirect("/shop")
        }

        for (let i = 0; i < product.variants.length; i++) {
            product.variants[i].offer = await calculateBestOffer(product, i)
        }

        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id }
        }).limit(4).lean()

        for (const item of relatedProducts) {
            let lowestPrice = Infinity
            let cheapestVariantIndex = 0

            for (let i = 0; i < item.variants.length; i++) {

                const offer = await calculateBestOffer(item, i)

                item.variants[i].offer = offer

                const finalPrice = offer.hasOffer
                    ? offer.finalPrice
                    : item.variants[i].salePrice

                if (finalPrice < lowestPrice) {
                    lowestPrice = finalPrice
                    cheapestVariantIndex = i
                }

            }

            item.displayPrice = lowestPrice
            item.defaultVariant = item.variants[cheapestVariantIndex]



        }

        const selectedVariantIndex = Number(req.query.variant) || 0
        const selectedVariant = product.variants[selectedVariantIndex]

        if (!selectedVariant) {
            return res.redirect(`/shop/product/${product.slug}`)
        }

        let isWishlisted = false

        if (req.user) {

            const wishlist = await Wishlist.findOne({
                userId: req.user._id
            })

            if (wishlist) {
                isWishlisted = wishlist.products.some(item =>
                    item.productId?.toString() === product._id.toString() &&
                    item.variantId?.toString() === selectedVariant._id.toString()
                )
            }
        }

        res.render('user/productDetails', {
            product,
            relatedProducts,
            selectedVariantIndex,
            showNavbar: true,
            isWishlisted
        })

    } catch (error) {
        console.log("product details error : ", error)
    }
}

export const loadCart = async (req, res) => {

    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                loginRequired: true
            })
        }

        let subtotal = 0
        let offerDiscount = 0

        const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId")
        let items = []

        if (cart && cart.items.length > 0) {

            items = []

            for (const item of cart.items) {

                const product = item.productId

                if (!product) continue

                const variant = product.variants?.[item.variantIndex]

                if (!variant) continue



                const selectedSize = variant.sizes?.find(s => s.size === item.size)

                let updatedQuantity = item.quantity

                if (!product.isActive || product.isDeleted) {
                    updatedQuantity = 0
                    item.quantity = 0
                }

                const offer = await calculateBestOffer(product, item.variantIndex)

                const originalPrice = variant.salePrice

                const price = offer.hasOffer
                    ? offer.finalPrice
                    : variant.salePrice
                offerDiscount += (variant.salePrice - price) * updatedQuantity
                subtotal += price * updatedQuantity

                items.push({
                    id: item._id,
                    productId: product._id,
                    slug: product.slug,
                    image_url: variant.images?.[0]?.url || "/images/default-product.png",
                    title: product.productName || "Product",
                    size: item.size,
                    color: variant.color || "N/A",
                    quantity: updatedQuantity,
                    originalPrice,
                    price,
                    offer,
                    isOutOfStock: selectedSize?.stock === 0,
                    isUnavailable: !product.isActive || product.isDeleted,
                    availableStock: selectedSize?.stock || 0,
                    variantIndex: item.variantIndex
                })
            }
        }

        const shipping = subtotal > 999 ? 0 : 99

        const grandTotal = subtotal + shipping
        const cartError = req.session.cartError || null
        req.session.cartError = null
        const cartCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0

        res.render("user/cart", {
            items,
            subtotal,
            offerDiscount,
            shipping,
            grandTotal,
            showNavbar: true,
            cartItemCount: cartCount,
            cartCount,
            cartError
        })

    } catch (error) {

        console.log("load cart error : ", error)
    }

}


export const addToCart = async (req, res) => {
    try {

        const cart = await Cart.findOne({ userId: req.user._id })
        const { productId, variantIndex, size } = req.body
        const cartItem = cart?.items.find(
            item => item.productId.toString() === productId &&
                item.variantIndex === Number(variantIndex) &&
                item.size === size
        )

        if (cartItem && cartItem.quantity >= 5) {
            return res.json({
                success: false,
                message: "Maximum cart limit reached. (5 items)"
            })
        }

        await addingToCart({ userId: req.user._id, ...req.body })

        const updatedCart = await Cart.findOne({ userId: req.user._id })
        const cartCount = updatedCart ? updatedCart.items.reduce((total, item) => total + item.quantity, 0) : 0

        return res.status(200).json({
            success: true,
            message: "✓ Added to cart",
            redirect: "/shop/cart",
            cartCount
        })

    } catch (error) {

        console.log("add to cart controller error", error)

        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            })
        }


        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR
        })
    }
}


export const removeCartItem = async (req, res) => {
    try {

        const { itemId } = req.params

        const result = await removeCartItemService(
            req.user._id,
            itemId,
        )
        if (req.session.checkout?.couponId) {

            const couponValidation = await validateCoupon(
                req.session.checkout.couponCode,
                req.user._id,
                result.subtotal
            )

            if (!couponValidation.success) {
                req.session.checkout = null
                result.couponDiscount = 0
                result.grandTotal = result.subtotal + result.shipping
                result.couponRemoved = true
                result.couponMessage = couponValidation.message

            } else {

                const couponResult = calculateCouponDiscount(couponValidation.coupon, result.subtotal)

                req.session.checkout.discount = couponResult.discount
                result.couponDiscount = couponResult.discount
                result.grandTotal = result.subtotal - result.couponDiscount + result.shipping
                result.couponRemoved = false
            }
        }

        return res.json(result)

    } catch (error) {

        console.log("REMOVE FROM CART ERROR:", error)

        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            })
        }

        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR
        })
    }
}

export const clearCart = async (req, res) => {

    try {
        await Cart.updateOne({ userId: req.user._id },
            {
                $set: {
                    items: []
                }
            })
        return res.status(200).json({
            success: true,
            message: "Cart items removed succesfully"
        })
    } catch (error) {
        console.log("remove cart error", error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR
        })
    }
}


export const updateCartQuantity = async (req, res) => {
    try {

        const { itemId, action } = req.body
        const couponDiscount = req.session.checkout?.discount || 0

        const result = await updateCartQuantityService(
            req.user._id,
            itemId,
            action,
            couponDiscount
        )

        result.couponDiscount = 0
        result.couponRemoved = false


        if (req.session.checkout?.couponId) {

            const couponValidation = await validateCoupon(
                req.session.checkout.couponCode,
                req.user._id,
                result.subtotal
            )

            if (!couponValidation.success) {
                req.session.checkout = null
                result.couponDiscount = 0
                result.grandTotal = result.subtotal + result.shipping
                result.couponRemoved = true
                result.couponMessage = couponValidation.message

            } else {
                const couponResult = calculateCouponDiscount(couponValidation.coupon, result.subtotal)
                req.session.checkout.discount = couponResult.discount
                result.couponDiscount = couponResult.discount
                result.grandTotal = result.subtotal - result.couponDiscount + result.shipping
                result.couponRemoved = false
            }
        }

        return res.json(result)

    } catch (error) {

        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            })
        }

        console.log("Update Cart Quantity:", error)

        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR
        })

    }
}



export const loadWishlist = async (req, res) => {
    try {

        const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate("products.productId")

        let wishlistProducts = []

        if (wishlist) {

            wishlistProducts = await Promise.all(

                wishlist.products.map(async (item) => {

                    const product = item.productId
                    const variant = product.variants.id(item.variantId)

                    if (!variant) return null

                    const variantIndex = product.variants.findIndex(
                        v => v._id.toString() === item.variantId.toString()
                    )

                    const offer = await calculateBestOffer(product, variantIndex)

                    const totalStock = variant.sizes.reduce((sum, size) => sum + size.stock, 0) || 0

                    const isUnavailable = !product.isActive || product.isDeleted

                    const isOutOfStock = !isUnavailable && totalStock === 0

                    return {
                        _id: product._id,
                        variantId: item.variantId,
                        productName: product.productName,
                        slug: product.slug,
                        image: variant.images?.[0]?.url,
                        color: variant.color,
                        regularPrice: variant.regularPrice,
                        salePrice: offer.hasOffer
                            ? offer.finalPrice
                            : variant.salePrice,
                        offer,
                        variantIndex,
                        sizes: variant.sizes || [],
                        isUnavailable,
                        isOutOfStock
                    }
                })
            )
            wishlistProducts = wishlistProducts.filter(Boolean).filter(product => !product.isUnavailable)
        }

        res.render("user/wishlist", {
            wishlistProducts,
            showNavbar: true,
        })
    } catch (error) {
        console.log("Load wishlist error", error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR
        })
    }
}

export const toggleWishlist = async (req, res) => {
    try {

        const { productId, variantId } = req.body

        if (!productId || !variantId) {
            return res.status(400).json({
                success: false,
                message: "Product and variant are required"
            })
        }

        let wishlist = await Wishlist.findOne({ userId: req.user._id })

        if (!wishlist) {
            wishlist = await Wishlist.create({
                userId: req.user._id,
                products: [{ productId, variantId }]
            })

            return res.json({
                success: true,
                added: true,
                count: wishlist.products.length,
                message: "Added to wishlist"
            })
        }
        const exists = wishlist.products.some(item =>
            item.productId?.toString() === productId &&
            item.variantId?.toString() === variantId

        )
        if (exists) {
            wishlist.products = wishlist.products.filter(item =>
                !(item.productId?.toString() === productId &&
                    item.variantId?.toString() === variantId)
            )
            await wishlist.save()
            const wishlistCount = await getWishlistCountService(req.user._id)

            return res.json({
                success: true,
                added: false,
                wishlistCount,
                message: "Removed from wishlist"
            })
        }

        wishlist.products.push({ productId, variantId })

        await wishlist.save()

        const wishlistCount = await getWishlistCountService(req.user._id)

        return res.json({
            success: true,
            added: true,
            wishlistCount,
            message: "Added to wishlist"
        })

    } catch (error) {
        console.log("toggle wishlist error", error)

        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR
        })
    }
}

export const removeWishlistItem = async (req, res) => {
    try {
        const { productId, variantId } = req.body

        const wishlist = await Wishlist.findOne({ userId: req.user._id })

        if (wishlist) {
            wishlist.products = wishlist.products.filter(item =>
                !(item.productId.toString() === productId && item.variantId.toString() === variantId))

            await wishlist.save()
            const wishlistCount = await getWishlistCountService(req.user._id)

            return res.json({
                success: true,
                wishlistCount,
                message: " ✕ Removed from wishlist "
            })
        }
    } catch (error) {
        console.log("Remove  wishlist item error", error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR
        })
    }
}

//  ✓




export const checkout = async (req, res) => {
    try {
        const userId = req.user._id
        const cart = await Cart.findOne({ userId }).populate({ path: "items.productId", populate: { path: "category" } })
        const addresses = await addressService.getUserAddresses(userId)

        if (!cart || cart.items.length === 0) {
            return res.redirect("/shop/cart")
        }

        let subtotal = 0
        let cartItemCount = 0
        let hasInvalidItems = false

        const updatedItems = []

        for (const item of cart.items) {

            const product = item.productId

            let isUnavailable = false
            let isOutOfStock = false
            let availableStock = 0
            let salePrice = 0
            let offer = null

            if (!product || product.isDeleted || !product.isActive || !product.category || !product.category.isActive) {

                isUnavailable = true
                return res.redirect("/shop/cart")

            } else {
                const variant = product.variants[item.variantIndex]
                if (!variant) {
                    isUnavailable = true
                    return res.redirect("/shop/cart")
                } else {
                    const selectedSize = variant.sizes.find(
                        size => size.size === item.size
                    )

                    if (!selectedSize) {
                        req.session.cartError =
                            `${product.productName} - selected size is unavailable.`

                        return res.redirect("/shop/cart")
                    }

                    availableStock = selectedSize.stock

                    if (availableStock <= 0) {

                        req.session.cartError = `${product.productName} is out of stock.`

                        return res.redirect("/shop/cart")
                    }

                    if (item.quantity > availableStock) {

                        req.session.cartError = `Only ${availableStock} ${availableStock > 1 ? "items are" : "item is"} available for "${product.productName}". Please reduce the quantity to ${availableStock}.`

                        return res.redirect("/shop/cart")
                    }

                    offer = await calculateBestOffer(product, item.variantIndex)

                    salePrice = offer.hasOffer
                        ? offer.finalPrice
                        : variant.salePrice

                    subtotal += salePrice * item.quantity
                    cartItemCount += item.quantity
                }
            }

            if (isUnavailable || isOutOfStock) {
                hasInvalidItems = true
            }

            updatedItems.push({
                productId: product,
                variantIndex: item.variantIndex,
                size: item.size,
                quantity: item.quantity,
                _id: item._id,
                availableStock,
                salePrice,
                offer,
                image: product.variants[item.variantIndex]?.images?.[0]?.url,
                isUnavailable,
                isOutOfStock
            })
        }


        let originalTotal = 0
        let offerDiscount = 0

        for (const item of updatedItems) {
            const variant = item.productId.variants[item.variantIndex]
            originalTotal += variant.salePrice * item.quantity
            offerDiscount += (variant.salePrice - item.salePrice) * item.quantity
        }

        subtotal = originalTotal - offerDiscount
        const shipping = subtotal > 999 ? 0 : 99
        const couponDiscount = req.session.checkout?.discount || 0
        const grandTotal = subtotal - couponDiscount + shipping



        res.render("user/checkout", {
            cart: {
                items: updatedItems
            },
            addresses,
            originalTotal,
            offerDiscount,
            couponDiscount,
            subtotal,
            shipping,
            grandTotal,
            cartItemCount,
            hasInvalidItems,
            showNavbar: true
        })

    } catch (error) {
        console.log("checkout error", error)
    }
}

export const addcheckoutAddress = async (req, res) => {
    try {
        const userId = req.user._id
        console.log(req.body)

        const { error, value } = addressSchema.validate(req.body, { abortEarly: false })

        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details.map(err => ({
                    field: err.path[0],
                    message: err.message
                }))
            })
        }
        value.firstName = capitalizeName(value.firstName)
        value.lastName = capitalizeName(value.lastName)
        value.addressLine1 = normalizeText(value.addressLine1)
        const validatedData = {
            ...value,

            name: `${value.firstName} ${value.lastName}`.trim()
        }


        if (validatedData.isDefault) {
            await Address.updateMany(
                { user: userId },
                { isDefault: false }
            )
        }

        await addressService.addAddress(userId, validatedData)

        return res.status(201).json({
            success: true,
            message: "Address added successfully"
        })


    } catch (error) {
        console.log("add checkout address", error)
        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR
        })
    }
}



export const placeOrder = async (req, res) => {

    try {

        const userId = req.user._id
        const { addressId, paymentMethod } = req.body

        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: "Please select an Address"
            })
        }

        if (!["COD", "Wallet"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            })
        }

        const verifiedAddress = await addressService.getAddressById(
            addressId,
            userId
        )

        if (!verifiedAddress) {
            return res.status(STATUS.NOT_FOUND).json({
                success: false,
                message: MESSAGES.ADDRESS_NOT_FOUND
            })
        }

        const cart = await Cart.findOne({ userId })
            .populate({
                path: "items.productId",
                populate: {
                    path: "category"
                }
            })

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty"
            })
        }

        let subtotal = 0
        let couponDiscount = 0

        const orderItems = []

        for (const item of cart.items) {

            const product = item.productId

            if (!product) {
                return res.status(STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.PRODUCT_NOT_FOUND
                })
            }

            if (!product.isActive || product.isDeleted || !product.category || !product.category.isActive || product.category.isDeleted) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} is unavailable.`
                })
            }

            const variant = product.variants[item.variantIndex]

            if (!variant) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} variant is unavailable.`
                })
            }

            const sizeData = variant.sizes.find(
                s => s.size === item.size
            )

            if (!sizeData) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} size unavailable.`
                })
            }

            if (sizeData.stock <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} is out of stock.`
                })
            }

            if (item.quantity > sizeData.stock) {

                item.quantity = sizeData.stock

                await cart.save()

                return res.status(400).json({
                    success: false,
                    type: "stockUpdated",
                    message:
                        `Only ${sizeData.stock} quantity available for ${product.productName}.`,
                    availableStock: sizeData.stock
                })
            }

            const offer = await calculateBestOffer(product, item.variantIndex)

            const originalPrice = variant.salePrice

            const price = offer.hasOffer
                ? offer.finalPrice
                : originalPrice

            const totalOriginal = originalPrice * item.quantity

            const productDiscount = (originalPrice - price) * item.quantity

            const finalTotal = price * item.quantity

            subtotal += totalOriginal

            orderItems.push({
                productId: product._id,
                productName: product.productName,
                slug: product.slug,
                image: variant.images[0]?.url || "",
                color: variant.color,
                size: sizeData.size,
                variantId: variant._id,
                quantity: item.quantity,
                originalPrice,
                price,
                total: totalOriginal,
                productDiscount,
                couponDiscount: 0,
                finalTotal
            })
        }

        const offerDiscount = orderItems.reduce((sum, item) => sum + item.productDiscount, 0)

        const subtotalAfterOffer = subtotal - offerDiscount

        const shipping = subtotalAfterOffer > 999 ? 0 : 99

        if (req.session.checkout?.couponId) {

            const validation = await validateCoupon(
                req.session.checkout.couponCode,
                userId,
                subtotal
            )

            if (validation.success) {
                const result = calculateCouponDiscount(validation.coupon, subtotal)

                couponDiscount = result.discount

                const totalAfterOffer = orderItems.reduce((sum, item) => sum + item.finalTotal, 0)

                orderItems.forEach(item => {
                    item.couponDiscount = totalAfterOffer > 0 ? Number((item.finalTotal / totalAfterOffer * couponDiscount)) : 0

                    item.finalTotal -= item.couponDiscount
                })
            }
        }

        const grandTotal = subtotal - offerDiscount - couponDiscount + shipping


        if (paymentMethod === "Wallet") {

            const wallet = await getWalletService(userId)

            if (wallet.balance < grandTotal) {

                return res.status(400).json({
                    success: false,
                    message: `Insufficient wallet balance. Available balance: ₹${wallet.balance.toFixed(2)}`
                })
            }
        }


        const order = await createOrder(
            userId,
            cart,
            orderItems,
            subtotal,
            offerDiscount,
            couponDiscount,
            grandTotal,
            shipping,
            paymentMethod,
            verifiedAddress,
            req.session.checkout?.couponCode || null
        )
        if (req.session.checkout?.couponId) {
            await markCouponUsed(
                req.session.checkout.couponId,
                userId
            )
        }


        if (paymentMethod === "Wallet") {

            await debitWalletService(
                userId,
                grandTotal,
                `Payment for Order ${order.orderId}`,
                "order_payment",
                order._id
            )
        }

        req.session.checkout = null

        return res.status(201).json({
            success: true,
            message: paymentMethod === "Wallet"
                ? "Order placed successfully using wallet."
                : "Order placed successfully.",
            orderId: order.orderId,
            redirect: `/shop/paymentResult?status=success&orderId=${order.orderId}`
        })

    } catch (error) {
        console.log("Place order error", error)

        return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR
        })
    }
}



export const createRazorpayOrder = async (req, res) => {

    try {

        const userId = req.user._id
        const { addressId } = req.body

        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: "Please select an address."
            })
        }

        const verifiedAddress = await addressService.getAddressById(
            addressId,
            userId
        )

        if (!verifiedAddress) {
            return res.status(STATUS.NOT_FOUND).json({
                success: false,
                message: MESSAGES.ADDRESS_NOT_FOUND
            })
        }

        const cart = await Cart.findOne({ userId })
            .populate({
                path: "items.productId",
                populate: {
                    path: "category"
                }
            })

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            })
        }

        let subtotal = 0
        let offerDiscount = 0

        for (const item of cart.items) {

            const product = item.productId

            if (!product ||
                product.isDeleted ||
                !product.isActive ||
                !product.category ||
                !product.category.isActive ||
                product.category.isDeleted) {

                return res.status(STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.PRODUCT_NOT_FOUND
                })
            }

            const variant = product.variants[item.variantIndex]

            if (!variant) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} variant is unavailable.`
                })
            }

            const sizeData = variant.sizes.find(s => s.size === item.size)

            if (!sizeData) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} size unavailable.`
                })
            }

            if (sizeData.stock <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} is out of stock.`
                })
            }

            if (item.quantity > sizeData.stock) {
                return res.status(400).json({
                    success: false,
                    type: "stockUpdated",
                    message: `Only ${sizeData.stock} quantity available for ${product.productName}.`
                })
            }

            const offer = await calculateBestOffer(product, item.variantIndex)

            const originalPrice = variant.salePrice

            const price = offer.hasOffer ? offer.finalPrice : originalPrice

            subtotal += originalPrice * item.quantity

            offerDiscount += (originalPrice - price) * item.quantity
        }

        const subtotalAfterOffer = subtotal - offerDiscount

        const shipping = subtotalAfterOffer > 999 ? 0 : 99

        let couponDiscount = 0

        if (req.session.checkout?.couponId) {
            const validation = await validateCoupon(
                req.session.checkout.couponCode,
                userId,
                subtotal
            )

            if (validation.success) {
                const result = calculateCouponDiscount(validation.coupon, subtotal)

                couponDiscount = result.discount
            }
        }

        const grandTotal = subtotal - offerDiscount - couponDiscount + shipping

        if (grandTotal <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order amount."
            })
        }

        const order = await razorpay.orders.create({

            amount: Math.round(grandTotal * 100),
            currency: "INR",
            receipt: `order_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                addressId: addressId.toString()
            }
        })

        return res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            order,
            amount: grandTotal
        })

    } catch (error) {
        console.log("Create Razorpay order error:", error)

        return res.status(500).json({
            success: false,
            message: "Unable to initiate payment."
        })
    }
}

export const verifyRazorpayPayment = async (req, res) => {
    try {

        const userId = req.user._id

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            addressId
        } = req.body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !addressId) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment details."
            })
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex")

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed."
            })
        }

        const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id)

        if (!razorpayOrder) {
            return res.status(400).json({
                success: false,
                message: "Razorpay order not found."
            })
        }
        const payment = await razorpay.payments.fetch(razorpay_payment_id)

        if (payment.status !== "captured") {
            return res.status(400).json({
                success: false,
                message: "Payment was not completed."
            })
        }

        if (payment.order_id !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment."
            })
        }

        const verifiedAddress = await addressService.getAddressById(addressId, userId)

        if (!verifiedAddress) {
            return res.status(STATUS.NOT_FOUND).json({
                success: false,
                message: MESSAGES.ADDRESS_NOT_FOUND
            })
        }

        const cart = await Cart.findOne({ userId }).populate({
            path: "items.productId",
            populate: {
                path: "category"
            }
        })

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            })
        }

        let subtotal = 0
        let couponDiscount = 0
        const orderItems = []

        for (const item of cart.items) {

            const product = item.productId

            if (!product) {
                return res.status(STATUS.NOT_FOUND).json({
                    success: false,
                    message: MESSAGES.PRODUCT_NOT_FOUND
                })
            }

            if (!product.isActive || product.isDeleted || !product.category || !product.category.isActive || product.category.isDeleted) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} is unavailable.`
                })
            }

            const variant = product.variants[item.variantIndex]

            if (!variant) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} variant is unavailable.`
                })
            }

            const sizeData = variant.sizes.find(size => size.size === item.size)

            if (!sizeData) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} size unavailable.`
                })
            }

            if (sizeData.stock <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} is out of stock.`
                })
            }

            if (item.quantity > sizeData.stock) {
                return res.status(400).json({
                    success: false,
                    type: "stockUpdated",
                    message: `Stock changed for ${product.productName}. Please review your cart.`
                })
            }

            const offer = await calculateBestOffer(product, item.variantIndex)

            const originalPrice = variant.salePrice

            const price = offer.hasOffer ? offer.finalPrice : originalPrice

            const totalOriginal = originalPrice * item.quantity

            const productDiscount = (originalPrice - price) * item.quantity

            const finalTotal = price * item.quantity

            subtotal += totalOriginal

            orderItems.push({
                productId: product._id,
                productName: product.productName,
                slug: product.slug,
                image: variant.images[0]?.url || "",
                color: variant.color,
                size: sizeData.size,
                variantId: variant._id,
                quantity: item.quantity,
                originalPrice,
                price,
                total: totalOriginal,
                productDiscount,
                couponDiscount: 0,
                finalTotal
            })
        }

        const offerDiscount = orderItems.reduce((sum, item) => sum + item.productDiscount, 0)

        const subtotalAfterOffer = subtotal - offerDiscount

        const shipping = subtotalAfterOffer > 999 ? 0 : 99

        if (req.session.checkout?.couponId) {

            const validation = await validateCoupon(req.session.checkout.couponCode, userId, subtotal)

            if (validation.success) {

                const result = calculateCouponDiscount(validation.coupon, subtotal)

                couponDiscount = result.discount

                const totalAfterOffer = orderItems.reduce((sum, item) => sum + item.finalTotal, 0)

                orderItems.forEach(item => {

                    item.couponDiscount = totalAfterOffer > 0 ? Number(((item.finalTotal / totalAfterOffer) * couponDiscount).toFixed(2)) : 0

                    item.finalTotal -= item.couponDiscount
                })
            }
        }

        const grandTotal = subtotal - offerDiscount - couponDiscount + shipping

        const paidAmount = razorpayOrder.amount / 100

        if (Number(paidAmount.toFixed(2)) !== Number(grandTotal.toFixed(2))) {
            return res.status(400).json({
                success: false,
                message: "Payment amount does not match order amount."
            })
        }

        const order = await createOrder(
            userId,
            cart,
            orderItems,
            subtotal,
            offerDiscount,
            couponDiscount,
            grandTotal,
            shipping,
            "Razorpay",
            verifiedAddress,
            req.session.checkout?.couponCode || null
        )

        if (req.session.checkout?.couponId) {
            await markCouponUsed(
                req.session.checkout.couponId,
                userId
            )
        }

        req.session.checkout = null

        return res.status(200).json({
            success: true,
            message: "Payment successful. Order placed successfully.",
            orderId: order.orderId,
            redirect: `/shop/paymentResult?status=success&orderId=${order.orderId}`
        })

    } catch (error) {

        console.log("Verify Razorpay payment error", error)

        return res.status(500).json({
            success: false,
            message: "Payment verification failed."
        })
    }
}

export const orderStatus = async (req, res) => {
    try {
        console.log(" order status hit")
        const order = await Order.findOne({
            userId: req.user._id
        }).sort({ createdAt: -1 })
        console.log(order.orderId)
        res.render("user/orderStatus", {
            showNavbar: true,
            showFooter: false,

        })
    } catch (error) {
        console.log("Order status error", error)
    }
}






export const loadPaymentResult = async (req, res) => {
    try {

        const { status, orderId, message } = req.query

        res.render("user/paymentResult", {
            success: status === "success",
            orderId: orderId || null,
            message: message || null,
            showNavbar: true,
            showFooter: false
        })

    } catch (error) {
        console.log("Payment result error", error)
        res.status(500).render("500")
    }
}













