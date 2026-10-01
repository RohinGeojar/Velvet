import mongoose from "mongoose"

export const couponSchema = new mongoose.Schema(
    {
        couponCode: {
            type: String,
            unique: true,
            uppercase: true,
            trim: true,
            required: true
        },
        couponName: {
            type: String,
            required: true,
            trim: true
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true
        },
        discountValue: {
            type: Number,
            required: true,
            min: 1
        },
        minOrderAmount: {
            type: Number,
            default: 0,
            required: true
        },
        maxDiscountAmount: {
            type: Number,
            default: 0,
        },

        usageLimit: {
            type: Number,
            required: true,
        },

        usedCount: {
            type: Number,
            default: 0,
        },

        perUserLimit: {
            type: Number,
            default: 1,
        },
        isDeleted: {
            type: Boolean,
            default: false
        },

        startDate: {
            type: Date,
            required: true,
        },

        expiryDate: {
            type: Date,
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
        usedBy: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                count: {
                    type: Number,
                    default: 1,
                },
            },
        ],
    },
    {
        timestamps: true,
    }

)

export default mongoose.model("Coupon", couponSchema)