import Product from "../../models/productModel.js"
import { generateSlug } from "../../utils/slugify.js"



export const createProduct = async (productData, files) => {
    const slug = generateSlug(productData.productName)


    productData.variants.forEach((variant, index) => {

        const fieldName = `variantImages_${index}`

        const variantFiles = files.filter(
            file => file.fieldname === fieldName
        )
        if (variantFiles.length < 3) {

            throw new Error(
                `Variant ${index + 1} must contain at least 3 images`
            )
        }

        variant.images = variantFiles.map(
            file => file.filename
        )
    })

    const product = await Product.create({
        ...productData,
        slug
    })
    return product
}