
import mongoose from "mongoose";

// 

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

}, { _id: false });



const variantSchema = new mongoose.Schema({

    color: {
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
        type: String
    }],

    sizes: [sizeSchema]

}, { _id: false });



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

    variants: [variantSchema]

}, {

    timestamps: true
});
export default mongoose.model("Product",productSchema)