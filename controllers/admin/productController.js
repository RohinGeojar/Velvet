import Category from "../../models/categoryModel.js"
import Product from "../../models/productModel.js"
import { createProduct, updateProductService } from "../../services/admin/productService.js"
import { AppError } from "../../utils/AppError.js"
import { STATUS } from "../../utils/statusCodes.js"
import { productSchema } from "../../validators/productValidator.js"




export const loadProducts = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1

        const limit = parseInt(req.query.limit) || 5

        const skip = (page - 1) * limit

        const search = req.query.search || req.query.tableSearch || ""

        const filter = req.query.filter || "All"
        const sort = req.query.sort || "newest"

        let query = {}

        if (search) {

            query.productName = {
                $regex: search,
                $options: "i"
            }
        }
   




        if (filter === "Active") {

            query.isActive = true
            query.isDeleted = false
        }

        else if (filter === "Blocked") {

            query.isActive = false
            query.isDeleted = false
        }

        else if (filter === "OutOfStock") {

            query.isDeleted = false
        }

        else if (filter === "Deleted") {

            query.isDeleted = true
        }

        else {

            query.isDeleted = false
        }

        let sortOption = { createdAt: -1 }

        if (sort === "a-z") {
            sortOption = { productName: 1 }
        }
        if (sort === "z-a") {
            sortOption = { productName: -1 }
        }

        let products
        let totalFilteredProducts = 0

        if (filter === "OutOfStock") {

            const allProducts = await Product.find({
                ...query,
                isDeleted: false
            })
                .populate("category")
                .sort(sortOption)
                .lean();

            const outOfStockProducts = allProducts.filter(product => {

                const totalStock = product.variants.reduce((total, variant) => {

                    return total + variant.sizes.reduce((sum, size) => {

                        return sum + size.stock;

                    }, 0);

                }, 0);

                return totalStock === 0;
            });

            totalFilteredProducts = outOfStockProducts.length;

            products = outOfStockProducts.slice(
                skip,
                skip + limit
            );

        } else {

            products = await Product.find(query)
                .populate("category")
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean();

            totalFilteredProducts = await Product.countDocuments(query);
        }

        const totalPages = Math.ceil(totalFilteredProducts / limit) || 1;



        const [
            totalProductsCount,
            activeProductsCount,
            categoriesCount
        ] = await Promise.all([

            Product.countDocuments({
                isDeleted: false
            }),

            Product.countDocuments({
                isActive: true,
                isDeleted: false
            }),

            Category.countDocuments({
                isDeleted: false
            })

        ]);

        const allProducts = await Product.find({
            isDeleted: false
        });

        const outOfStockCount = allProducts.filter(product => {

            const totalStock = product.variants.reduce((total, variant) => {

                return total + variant.sizes.reduce((sum, size) => {

                    return sum + size.stock;

                }, 0)

            }, 0)

            return totalStock === 0

        }).length




        res.render("admin/productManagement", {

            activeNavLink: "Products",
            products,
            totalProductsCount,
            activeProductsCount,
            outOfStockCount,
            categoriesCount,
            currentPage: page,
            totalPages,
            totalResults: totalFilteredProducts,
            limit,
            searchQuery: search,
            filter,
            layout: false
        })

    } catch (error) {

        console.error("Error in loadProducts:", error)

        return res.status(500).send("Internal Server Error")
    }
}

export const loadAddProducts = async (req, res) => {
    try {
        const categories = await Category.find({ isDeleted: false })


        res.render("admin/addProduct", {
            activeNavLink: "Products",
            layout: false,
            categories

        })

    } catch (error) {
        console.log(error)
    }
}


export const addProduct = async (req, res) => {
    try {

        const { error, value } = productSchema.validate(req.body, {
            abortEarly: false
        })



        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details
            })
        }

        if (!req.files || req.files.length === 0) {

            return res.status(400).json({
                success: false,
                message: "Category image is required"
            })
        }

        const product = await createProduct(
            value,
            req.files
        )

        return res.status(201).json({
            success: true,
            message: "Product added successfully",
            redirect: "/products"

        })

    } catch (error) {
        console.log(error)
    }
}

export const loadEditProducts = async (req, res) => {
    try {
        const id = req.params.id
        const categories = await Category.find({ isDeleted: false })
        const product = await Product.findById(id)

        res.render("admin/editProduct", {
            activeNavLink: "Products",
            categories,
            product,
            layout: false
        })

    } catch (error) {
        console.log(error)
    }
}

export const updateProduct = async (req, res) => {
    try {

        const { id } = req.params


        const { error, value } = productSchema.validate(
            req.body,
            { abortEarly: false }
        )

        if (error) {
            return res.status(400).json({
                success: false,
                errors: error.details
            })
        }


        await updateProductService(id, req.body, req.files, value)

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            redirect: "/products"
        })

    } catch (error) {

        console.log(
            "Update product error :",
            error
        )

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        })
    }
}


export const blockProduct = async (req, res) => {
    try {

        const { id } = req.params

        await Product.findByIdAndUpdate(id, {
            isActive: false
        })

        return res.json({
            success: true,
            message: "Product blocked successfully"
        })
    } catch (error) {

        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}

export const unBlockProduct = async (req, res) => {
    try {

        const { id } = req.params

        await Product.findByIdAndUpdate(id, { isActive: true })

        return res.json({
            success: true,
            message: "Product unblocked successfully"
        })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params
        console.log("id:", id)

        await Product.findByIdAndUpdate(id, { isDeleted: true })

        return res.json({
            success: true,
            message: "Product deleted successfully"
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}

export const restoreProduct = async (req, res) => {
    try {

        const { id } = req.params

        await Product.findByIdAndUpdate(id, { isDeleted: false })

        return res.json({
            success: true,
            message: "Product restored successfully"
        })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}
export const searchProducts = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1

        const limit = parseInt(req.query.limit) || 5

        const skip = (page - 1) * limit

        const search = req.query.search || ""

        const filter = req.query.filter || "All"

        const sort = req.query.sort || "newest"

        let sortOption = { createdAt: -1 }

        if (sort === "a-z") {
            sortOption = { productName: 1 }
        }

        if (sort === "z-a") {
            sortOption = { productName: -1 }
        }

        let query = {}

        if (search) {

            query.productName = {
                $regex: search,
                $options: "i"
            };
        }



        if (filter === "Active") {

            query.isActive = true;
            query.isDeleted = false;
        }

        else if (filter === "Blocked") {

            query.isActive = false;
            query.isDeleted = false;
        }

        else if (filter === "OutOfStock") {

            query.isDeleted = false;
        }

        else if (filter === "Deleted") {

            query.isDeleted = true;
        }

        else {

            query.isDeleted = false;
        }




        let products =
            await Product.find(query)

                .populate("category")

                .sort(sortOption)

                .skip(skip)

                .limit(limit)

                .lean();




        if (filter === "OutOfStock") {

            products =
                products.filter(product => {

                    const totalStock =
                        product.variants.reduce((total, variant) => {

                            return total + variant.sizes.reduce((sum, size) => {

                                return sum + size.stock;

                            }, 0);

                        }, 0);

                    return totalStock === 0;
                });
        }




        let totalFilteredProducts = await Product.countDocuments(query);


        if (filter === "OutOfStock") {

            const allFilteredProducts = await Product.find({
                isDeleted: false
            })

            totalFilteredProducts = allFilteredProducts.filter(product => {

                const totalStock = product.variants.reduce((total, variant) => {

                    return total + variant.sizes.reduce((sum, size) => {

                        return sum + size.stock;

                    }, 0)

                }, 0)

                return totalStock === 0;

            }).length
        }


        const totalPages = Math.ceil(totalFilteredProducts / limit) || 1


        return res.json({
            success: true,
            products,
            currentPage: page,
            totalPages,
            totalResults: totalFilteredProducts
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}

