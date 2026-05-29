import mongoose from "mongoose"
import Category from "../../models/categoryModel.js"
import Product from "../../models/productModel.js"
import Cart from "../../models/cartModel.js"
import { AppError } from "../../utils/AppError.js"
import { addingToCart } from "../../services/user/cartService.js"

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

        // Search
        if (search.trim()) {

            query.productName = {
                $regex: search.trim(),
                $options: "i"
            }
        }

        // Category Filter
        if (category && mongoose.Types.ObjectId.isValid(category)) {

            query.category = category
        }

        // Price Filter
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
        if (color) {

            query["variants.color"] = color

        }
        if (fabric) {

            query.fabric = fabric

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
            })

            .sort(sortOption)
            .lean()


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

        const totalPages = Math.ceil(totalProducts / limit )


        const paginatedProducts = filteredProducts.slice(
            skip,
            skip + limit
        )




        const categories = await Category.find({
            isActive: true,
            isDeleted: false
        }).lean()

        res.render("user/shop", {
            products: paginatedProducts,
            categories,
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
            showNavbar: true,
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

       
        const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId")
        let items = []

        if (cart && cart.items.length > 0) {
            items = cart.items.filter(item => {

                const product = item.productId

                if (!product) return false

                const variant =
                    product.variants?.[
                    item.variantIndex
                    ]

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
            items,
            subtotal,
            discount,
            shipping,
            showNavbar: true,
             cartCount:cart.items.length

        })

    } catch (error) {

        console.log("load cart error : ", error)
    }

};


export const addToCart = async (req, res) => {
    try {
        const result = await addingToCart({
            userId: req.user._id,
            ...req.body
        })

        return res.status(200).json({
            success: true,
            message: "Added to cart successfully",
            redirect: "/shop/cart"
        })

    } catch (error) {
        console.log("add to cart error : ", error)
        if (error instanceof AppError) {

            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }


        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}


export const removeCartItem = async (req, res) => {

    try {

        const { itemId } = req.params;

        await Cart.updateOne(
            {
                userId: req.user._id
            },
            {
                $pull: {
                    items: {
                        _id: itemId
                    }
                }
            }
        );

        return res.json({
            success: true
        });

    } catch (error) {

        return res.status(500).json({
            success: false
        });

    }
};