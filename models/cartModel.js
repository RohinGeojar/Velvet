import mongoose from "mongoose"

const cartItemSchema = new mongoose.Schema({

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    variantIndex: Number,
    size: String,
    quantity: Number
})

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    items: [cartItemSchema]

}, { timestamps: true })


export default mongoose.model("Cart", cartSchema)