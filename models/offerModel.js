import mongoose from "mongoose"

const offerSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true,
        trim: true
    },

    offerType: {
        type: String,
        enum: ["product", "category"],
        required: true
    },

    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],

    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }],

    discountType: {
        type: String,
        enum: ["percentage"],
        default: "percentage"
    },

    discountValue: {
        type: Number,
        required: true
    },

    startDate: {
        type: Date,
        required: true
    },

    expiryDate: {
        type: Date,
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    },

    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })


export default mongoose.model("Offer", offerSchema)