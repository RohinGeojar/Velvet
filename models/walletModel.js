import mongoose from "mongoose"


const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["credit", "debit"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
    },
    purpose: {
        type: String,
        enum: [
            "wallet_payment",
            "wallet_topup",
            "order_cancelled",
            "order_return",
            "referral_bonus",
            "admin_credit",
            "order_payment"
        ],
        required: true
    }

}, { timestamps: true })

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        balance: {
            type: Number,
            default: 0,
            min: 0
        },

        transactions: [transactionSchema]
    }, { timestamps: true })


    walletSchema.index(
    { "transactions.transactionId": 1 },
    {
        unique: true,
        partialFilterExpression: {
            "transactions.transactionId": { $type: "string" }
        }
    }
)
export default mongoose.model("Wallet", walletSchema)