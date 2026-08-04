import mongoose from "mongoose"
import Category from "../../models/categoryModel.js"
import Product from "../../models/productModel.js"
import Cart from "../../models/cartModel.js"
import Wishlist from "../../models/wishlistModel.js"
import Address from "../../models/address.js"
import { AppError } from "../../utils/AppError.js"
import { addingToCart } from "../../services/user/cartService.js"
import * as addressService from "../../services/user/addressService.js";
import { addressSchema } from "../../validators/addressValidator.js"
import { capitalizeName, normalizeText } from "../../utils/capitalizer.js"
import { createOrder } from "../../services/user/orderService.js"
import Order from "../../models/order.js"

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
            fabric = "",
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
            });

        if (selectedCategory) {

            query.category =
                selectedCategory._id;
        }
        const categories = await Category.find({
            isActive: true,
            isDeleted: false
        });

        const normalizedSearch =
            search
                .toLowerCase()
                .replace(/[\s-]/g, "");

        const matchedCategories =
            categories.filter(category => {

                const normalizedName =
                    category.name
                        .toLowerCase()
                        .replace(/[\s-]/g, "");

                const normalizedSlug =
                    category.slug
                        .toLowerCase()
                        .replace(/[\s-]/g, "");

                return (
                    normalizedName.includes(
                        normalizedSearch
                    ) ||

                    normalizedSlug.includes(
                        normalizedSearch
                    )
                )
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
        ]);

        let dbMinPrice = priceData.minPrice
        let dbMaxPrice = priceData.maxPrice


        const filteredProducts = products.filter(
            product => product.category
        )
        filteredProducts.forEach(product => {

            product.displayPrice = Math.min(
                ...product.variants.map(
                    variant => variant.salePrice
                )
            )
        })
        if (sort === "price_asc") {

            filteredProducts.sort(
                (a, b) =>
                    a.displayPrice - b.displayPrice
            )
        }
        if (sort === "price_desc") {
            filteredProducts.sort(
                (a, b) =>
                    b.displayPrice - a.displayPrice
            )
        }
        if (sort === "a_z") {
            filteredProducts.sort(
                (a, b) =>
                    a.productName.localeCompare(b.productName)
            )
        }
        if (sort === "z_a") {

            filteredProducts.sort(
                (a, b) =>
                    b.productName.localeCompare(a.productName)
            )
        }

        const totalProducts = filteredProducts.length;
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

        if (!product) {

            return res.redirect("/shop")
        }

        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id }

        }).limit(4).lean()
        const selectedVariantIndex = Number(req.query.variant) || 0;


        res.render('user/productDetails', {
            product,
            relatedProducts,
            selectedVariantIndex,
            showNavbar: true
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
            });
        }


        const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId")
        let items = []

        if (cart && cart.items.length > 0) {
            items = cart.items.filter(item => {

                const product = item.productId

                if (!product) return false

                const variant = product.variants?.[item.variantIndex]

                return variant
            }).map(item => {
                const product = item.productId

                const variant = product?.variants?.[item.variantIndex]

                const totalAvailableStock = variant?.sizes?.reduce((acc, size) => acc + size.stock, 0) || 0

                const selectedSize = variant?.sizes?.find(s => s.size === item.size)

                let updatedQuantity = item.quantity

                if (selectedSize && selectedSize.stock < item.quantity) {
                    updatedQuantity = selectedSize.stock
                    item.quantity = updatedQuantity
                }
                if (!product.isActive ||
                    product.isDeleted) {

                    updatedQuantity = 0;

                    item.quantity = 0;
                }

                return {

                    id: item._id,
                    productId: product._id,
                    slug: product.slug,
                    image_url: variant?.images?.[0]?.url || "/images/default-product.png",
                    title: product?.productName || "Product",
                    size: item.size,
                    color: variant?.color || "N/A",
                    quantity: updatedQuantity,
                    price: variant?.salePrice || 0,
                    isOutOfStock: selectedSize?.stock === 0,
                    isUnavailable: !product.isActive || product.isDeleted,
                    availableStock: selectedSize?.stock || 0,
                    variantIndex: item.variantIndex,


                }

            })

        }

        const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0)
        const discount = 0

        const shipping = subtotal > 1000 ? 0 : 99



        res.render("user/cart", {
            items: items || [],
            subtotal,
            discount,
            shipping,
            showNavbar: true,
            cartCount: cart?.items?.length

        })

    } catch (error) {

        console.log("load cart error : ", error)
    }

};


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

        const result = await addingToCart({ userId: req.user._id, ...req.body })

        return res.status(200).json({
            success: true,
            message: "✓ Added to cart",
            redirect: "/shop/cart"
        })

    } catch (error) {
       
        console.log("add to cart controller error", error)

        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            })
        }


        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}


export const removeCartItem = async (req, res) => {

    try {
        const { itemId } = req.params

        const cart = await Cart.findOneAndUpdate(
            { userId: req.user._id },
            {
                $pull: {
                    items: {
                        _id: itemId
                    }
                }
            },
            { new: true }
        ).populate("items.productId")

        let subtotal = 0


        cart.items.forEach(item => {
            const variant = item.productId.variants[item.variantIndex]
            console.log(variant, "          >>>>> ")
            subtotal += variant.salePrice * item.quantity
        })

        const shipping = subtotal > 999 ? 0 : 99

        const discount = 0

        const grandTotal = subtotal + shipping - discount

        return res.json({
            success: true,
            cartCount: cart.items.length,
            subtotal,
            shipping,
            discount,
            grandTotal
        })

    } catch (error) {
        console.log("REMOVE FROM CART ERROR:", error)

        return res.status(500).json({
            success: false
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
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

export const updateCartQuantity = async (req, res) => {

    try {
        const { itemId, action } = req.body

        const cart = await Cart.findOne({ userId: req.user._id })

        const item = cart?.items.find(item => item._id.toString() === itemId)

        if (!item) {
            return res.status(400).json({
                success: false,
                type: "removed",
                messaage: "This item is no longer in your cart"
            })
        }

        let cartCount = 0
        const product = await Product.findById(item.productId)
        const category = await Category.findById(product.category)
        const variant = product.variants[item.variantIndex]

        if (!product || !product.isActive || product.isDeleted) {
            return res.status(400).json({
                success: false,
                type: "unavailable",
                message: "Product unavailable"
            })
        }
        if (!category || !category.isActive || category.isDeleted) {
            return res.status(400).json({
                success: false,
                type: "unavailable",
                message: "This product is unavailable"
            })
        }
        if (!variant) {
            return res.status(400).json({
                success: false,
                type: "unavailable",
                message: "selected variant is unavailbale"
            })
        }

        const sizeObj = variant.sizes.find(size => size.size === item.size)

        const availableStock = sizeObj?.stock || 0

        let newQuantity = item.quantity

        if (action == "increment") {
            newQuantity++
            cartCount += newQuantity
        }
        if (action == "decrement") {
            if (item.quantity === 1) {
                return res.status(400).json({
                    success: false,
                    type: "minimum",
                    message: "Minimum quantity is 1"
                })
            }
            newQuantity--
            cartCount += newQuantity
        }
        if (newQuantity > 5) {
            return res.status(400).json({
                success: false,
                type: "limit",
                message: "Maximum 5 quanities allowded "
            })
        }

        if (newQuantity > availableStock) {
            return res.status(400).json({
                success: false,
                type: "stock",
                message: `! Insufficient stock only ${availableStock} left `
            })
        }
        item.quantity = newQuantity

        await cart.save();
        let subtotal = 0
        for (const cartItem of cart.items) {

            const product = await Product.findById(cartItem.productId);

            if (!product || !product.isActive || product.isDeleted) continue;

            const variant = product.variants[cartItem.variantIndex];

            if (!variant) continue;

            const size = variant.sizes.find(
                s => s.size === cartItem.size
            );

            if (!size || size.stock <= 0) continue;

            subtotal += variant.salePrice * cartItem.quantity;
        }

        const shipping = subtotal > 999 ? 0 : 99;
        const discount = 0;
        const grandTotal = subtotal - discount + shipping;

        return res.json({
            success: true,
            quantity: newQuantity,
            itemTotal: variant.salePrice * newQuantity,
            subtotal, shipping,
            discount,
            grandTotal,
            cartCount
        });


    } catch (error) {
        console.log("update Cart Quantity error : ", error)
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}

export const loadWishlist = async (req, res) => {
    try {

        const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate("products.productId")

        let wishlistProducts = []

        if (wishlist) {
            wishlistProducts = wishlist.products.map(item => {

                const product = item.productId
                const variant = product.variants.id(item.variantId)
                const variantIndex = product.variants.findIndex(variant => variant._id.toString() === item.variantId.toString())
                const totalStock = variant?.sizes.reduce((sum, size) => sum + size.stock, 0) || 0
                const isUnavailable = !product.isActive || product.isDeleted || !variant;
                const isOutOfStock = !isUnavailable && totalStock === 0


                return {
                    _id: product._id,
                    variantId: item.variantId,
                    productName: product.productName,
                    slug: product.slug,
                    image: variant?.images?.[0]?.url,
                    color: variant?.color,
                    price: variant?.salePrice,
                    variantIndex,
                    sizes: variant?.sizes || [],
                    isUnavailable,
                    isOutOfStock
                }
            })
        }


        res.render("user/wishlist", {
            wishlistProducts,
            showNavbar: true,
        })
    } catch (error) {
        console.log("Load wishlist error", error)
    }
}

export const toggleWishlist = async (req, res) => {
    try {

        const { productId, variantId } = req.body


        let wishlist = await Wishlist.findOne({ userId: req.user._id })

        if (!wishlist) {
            wishlist = await Wishlist.create({
                userId: req.user._id,
                products: [{ productId, variantId }]
            })

            return res.json({
                success: true,
                added: true,
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

            return res.json({
                success: true,
                added: false,
                message: "Removed from wishlist"
            })
        }

        wishlist.products.push({ productId, variantId })

        await wishlist.save()

        return res.json({
            success: true,
            added: true,
            message: "Added to wishlist"
        })

    } catch (error) {
        console.log("toggle wishlist error", error)

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
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

            return res.json({
                success: true,
                message: " ✕ Removed from wishlist "
            })
        }
    } catch (error) {
        console.log("Remove  wishlist item error", error)
    }
}

//  ✓













export const checkout = async (req, res) => {
    try {
        const userId = req.user._id
        const cart = await Cart.findOne({ userId }).populate({ path: "items.productId", populate: { path: "category" } }).lean()
        const addresses = await addressService.getUserAddresses(userId);

        if (!cart || cart.items.length === 0) {
            return res.redirect("/shop/cart")
        }

        let subtotal = 0
        let cartCount = 0
        let hasInvalidItems = false

        cart.items = cart.items.map(item => {
            const product = item.productId

            let isUnavailable = false
            let isOutOfStock = false
            let availableStock = 0
            let salePrice = 0

            if (!product || product.isDeleted || !product.isActive || !product.category || !product.category.isActive) {
                isUnavailable = true
            } else {
                const variant = product.variants[item.variantIndex]
                if (!variant) {
                    isUnavailable = true
                } else {
                    const selectedSize = variant.sizes.find(
                        size => size.size === item.size
                    );

                    availableStock = selectedSize?.stock || 0;
                    salePrice = variant.salePrice;



                    if (availableStock <= 0) {
                        isOutOfStock = true
                    } else {
                        subtotal += salePrice * item.quantity
                        cartCount += item.quantity
                    }
                }
            }
            if (isUnavailable || isOutOfStock) {
                hasInvalidItems = true
            }
            return {
                ...item,
                availableStock,
                salePrice,
                image: product?.variants?.[item.variantIndex]?.images?.[0]?.url,
                isUnavailable,
                isOutOfStock
            }
        })

        const shipping = subtotal > 999 ? 0 : 99

        const discount = 0

        const actualTotal = subtotal + shipping - discount
        const grandTotal = Math.round(actualTotal)
        const roundOff = grandTotal - actualTotal



        res.render("user/checkout", {
            cart,
            addresses,
            subtotal,
            shipping,
            discount,
            grandTotal,
            cartCount,
            hasInvalidItems,
            roundOff,
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
            );
        }

        await addressService.addAddress(userId, validatedData);

        return res.status(201).json({
            success: true,
            message: "Address added successfully"
        });


    } catch (error) {
        console.log("add checkout address", error)
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
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
        const verifiedAddress = await addressService.getAddressById(addressId, userId)

        if (!verifiedAddress) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId")

        if (!cart) {
            return res.status(400).json({
                success: false,
                message: "Cart is Empty"
            })
        }
        if (cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "your cart is Empty"
            })
        }

        let subtotal = 0
        const orderItems = []

        for (let item of cart.items) {
            const product = item.productId

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "One or more products no longer exist."
                })
            }
            if (!product.isActive || product.isDeleted) {
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
            const sizeData = variant.sizes.find(s =>
                s.size === item.size)
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
                    message: `Only ${sizeData.stock} quantity available for ${product.productName}.`,
                    availableStock: sizeData.stock
                })
            }
            const price = variant.salePrice

            subtotal += price * item.quantity
            orderItems.push({
                productId: product._id,
                productName: product.productName,
                slug: product.slug,
                image: variant.images[0]?.url || "",
                color: variant.color,
                size: sizeData.size,
                variantId: variant._id,
                quantity: item.quantity,
                price: variant.salePrice,
                total: variant.salePrice * item.quantity
            })



        }
        let shipping = subtotal > 999 ? 0 : 99
        const discount = 0

        if (subtotal === 0) {
            shipping = 0
        }

        let grandTotal = subtotal - discount
        if (grandTotal > 999) {
            subtotal - discount
        } else {
            grandTotal = subtotal - discount + shipping
        }


        if (paymentMethod !== "COD") {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method."
            })
        }
        if (subtotal > 100000) {
            return res.status(400).json({
                success: false,
                message: "Cash on Delivery is unavailable for orders above ₹10000."
            })
        }
        grandTotal = Math.round(grandTotal)
        const order = await createOrder(userId, cart, orderItems, subtotal, grandTotal, shipping, paymentMethod, verifiedAddress)
        console.log(grandTotal)

        return res.status(201).json({
            success: true,
            message: "Order placed successfully.",
            orderId: order.orderId,
            redirect: "/shop/orderSuccess"
        })
    } catch (error) {
        console.log("Place order error", error)
        return res.status(500).json({
            success: false,
            message: "Something went Wrong"

        })
    }
}


export const orderStatus = async (req, res) => {
    try {
        console.log(" order status hit")
        const order = await Order.findOne({
            userId: req.user._id
        }).sort({ createdAt: -1 });
        console.log(order.orderId)
        res.render("user/orderStatus", {
            showNavbar: true,
            showFooter: false,

        })
    } catch (error) {
        console.log("Order status error", error)
    }
}





















