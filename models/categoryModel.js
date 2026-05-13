
import mongoose from "mongoose"

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    description: {
        type: String,
        default: ""
    },
    image: {
        url: String,
        public_id: String
    },

    isDeleted: {
        type: Boolean,
        default: false
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true,
    }

}, { timestamps: true })

export default mongoose.model("Category", categorySchema)