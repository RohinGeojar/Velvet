
import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    productName: {
        type: String,
        required: true,

    },
    slug: String,

    image: String,

    color: String,

    size: String,
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: [
            "Pending",
            "Confirmed",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Return Requested",
            "Returned"
        ],
        default: "Pending"
    },
    cancelReason: {
        type: String,
        default: null
    },
    returnReason: {
        type: String,
        default: null
    },
    returnRequestedAt: {
        type: Date,
        default: null
    },

    returnApprovedAt: {
        type: Date,
        default: null
    },

    returnRejectedAt: {
        type: Date,
        default: null
    },
    returnRejected: {
    type: Boolean,
    default: false
},
returnRejectReason: {
    type: String,
    default: null
}


}, { _id: true })


const shippingAddressSchema = new mongoose.Schema({

    name: String,

    phone: String,

    addressLine1: String,

    addressLine2: String,

    landmark: String,

    city: String,

    state: String,

    country: String,

    postalCode: String

}, { _id: false })

const timelineSchema = new mongoose.Schema({

    status: {
        type: String,
        required: true
    },

    message: {
        type: String,
        default: ""
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }

}, { _id: false })


const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderId: {
        type: String,
        unique: true,
        required: true
    },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
        type: String,
        enum: ["COD", "Wallet", "Razorpay"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: [
            "Pending",
            "Paid",
            "Failed",
            "Refunded"
        ],
        default: "Pending"
    },
    orderStatus: {
        type: String,
        enum: [
            "Pending",
            "Confirmed",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Return Requested",
            "Returned"
        ],
        default: "Pending"
    },
    paymentDetails: {
        transactionId: {
            type: String,
            default: null
        },

        paymentId: {
            type: String,
            default: null
        },

        signature: {
            type: String,
            default: null
        }
    },
    subtotal: {
        type: Number,
        required: true
    },
    shippingCharge: {
        type: Number,
        default: 0
    },
    productDiscount: {
        type: Number,
        default: 0
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        required: true
    },
    couponCode: {
        type: String,
        default: null
    },

    invoiceNumber: {
        type: String,
        default: null
    },
    confirmedAt: {
        type: Date,
        default: null
    },
    shippedAt: {
        type: Date,
        default: null
    },

    deliveredAt: {
        type: Date,
        default: null
    },

    cancelledAt: {
        type: Date,
        default: null
    },

    returnedAt: {
        type: Date,
        default: null
    },

    refundStatus: {
        type: String,
        enum: [
            "Not Applicable",
            "Pending",
            "Processing",
            "Completed",
            "Rejected"
        ],
        default: "Not Applicable"
    },

    timeline: {
        type: [timelineSchema],
        default: () => [
            {
                status: "Pending",
                message: "Order placed successfully",
                updatedAt: new Date()
            }
        ]
    },

    placedAt: {
        type: Date,
        default: Date.now()
    }


}, { timestamps: true })

export default mongoose.model("Order", orderSchema)