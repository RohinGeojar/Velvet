
import mongoose from "mongoose";



const sizeSchema = new mongoose.Schema({

    size: {
        type: String,
        enum: ["S", "M", "L", "XL"],
        required: true
    },

    stock: {
        type: Number,
        required: true,
        min: 0
    }

}, { _id: false })



const variantSchema = new mongoose.Schema({

    color: {
        type: String,
        required: true
    },
    colorCode: {
        type: String,
        required: true
    },

    regularPrice: {
        type: Number,
        required: true
    },

    salePrice: {
        type: Number,
        required: true
    },

    images: [{
        public_id: String,
        url: String
    }],

    sizes: [sizeSchema]

})



const productSchema = new mongoose.Schema({

    productName: {
        type: String,
        required: true
    },

    slug: {
        type: String,
        required: true
    },

    productTitle: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    materialDetails: {
        type: String,
        required: true
    },

    materialCare: {
        type: String,
        required: true
    },

    shippingDetails: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },

    isDeleted: {
        type: Boolean,
        default: false
    },

    variants: [variantSchema]

}, {

    timestamps: true
})
export default mongoose.model("Product", productSchema)