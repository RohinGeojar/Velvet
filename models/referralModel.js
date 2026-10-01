import mongoose from "mongoose"

const referralSchema = new mongoose.Schema(
    {
        referrerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        referredUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        referralCode: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["pending", "completed", "rewarded"],
            default: "pending",
        },

        qualifyingOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },

        referrerReward: {
            type: Number,
            default: 0,
        },

        referredUserReward: {
            type: Number,
            default: 0,
        },

        rewardedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
)

referralSchema.index(
    { referrerId: 1, referredUserId: 1 },
    { unique: true }
)

const Referral = mongoose.model("Referral", referralSchema)

export default Referral