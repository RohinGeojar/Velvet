import Product from "../../models/productModel.js"
import { AppError } from "../../utils/AppError.js"
import { capitalizeName, normalizeText } from "../../utils/capitalizer.js"
import { generateSlug } from "../../utils/slugify.js"



export const createProduct = async (productData, files) => {


    let baseSlug = generateSlug(productData.productName, { lower: true })
    let slug = baseSlug;

    let counter = 1;

    while (await Product.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }


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
            file => ({
                public_id: file.filename,
                url: file.path
            })
        )
    })

    const product = await Product.create({
        ...productData,
        slug
    })
    return product
}


export const updateProductService = async (id, body, files, value) => {

    const product = await Product.findById(id);

    let baseSlug = generateSlug(
        value.productName,
        { lower: true }
    );

    let slug = baseSlug;

    let counter = 1;

    while (
        await Product.findOne({
            slug,
            _id: { $ne: id }
        })
    ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }


    if (!product) {
        throw new AppError("Product not found", 404)
    }
    let productName = capitalizeName(value.productName)
    let productTitle = normalizeText(value.productTitle)

    body.variants.forEach((variant, index) => {

        let existingImages = variant.existingImages || []

        if (!Array.isArray(existingImages)) {
            existingImages = [existingImages]
        }


        const oldImages =
            existingImages.map(url => ({
                public_id:"",
                url
            }))


        const variantFiles = files.filter(file => file.fieldname === `variantImages_${index}`)

        const newImages = variantFiles.map(file => ({
            public_id: file.filename,
            url: file.path
        }))
        variant.images = [
            ...oldImages,
            ...newImages
        ]

        delete variant.existingImages;
    })


    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
            ...value, productName, productTitle,
            variants: body.variants, slug
        },
        { new: true }
    )

    return updatedProduct;
}