import crypto from "crypto"
import User from "../../models/user.js"
import Referral from "../../models/referralModel.js"
import Order from "../../models/order.js"
import { creditWalletService } from "./walletService.js"

const REFERRAL_REWARD = Number(process.env.REFERRAL_REWARD || 100)

const generateReferralCode = async () => {
    let referralCode
    let exists = true

    while (exists) {
        referralCode = "VELVET" + crypto.randomBytes(4).toString("hex").toUpperCase()
        exists = await User.exists({ referralCode })
    }

    return referralCode
}

export const ensureReferralCode = async (userId) => {
    const user = await User.findById(userId)

    if (!user) {
        throw new Error("User not found")
    }

    if (user.referralCode) {
        return user.referralCode
    }

    user.referralCode = await generateReferralCode()
    await user.save()

    return user.referralCode
}

export const getReferralDetails = async (userId) => {
    const user = await User.findById(userId)

    if (!user) {
        throw new Error("User not found")
    }

    if (!user.referralCode) {
        user.referralCode = await generateReferralCode()
        await user.save()
    }

    const referrals = await Referral.find({
        referrerId: userId,
    })
        .populate("referredUserId", "firstName lastName email")
        .populate("qualifyingOrderId", "orderId")
        .sort({ createdAt: -1 })

    const rewardedReferrals = referrals.filter(
        referral => referral.status === "rewarded"
    )

    const pendingReferrals = referrals.filter(
        referral => referral.status === "pending"
    )

    const rewardsEarned = rewardedReferrals.reduce(
        (total, referral) => total + (referral.referrerReward || 0), 0)

    const pendingRewards = pendingReferrals.length * REFERRAL_REWARD

    return {
        referralCode: user.referralCode,
        reward: REFERRAL_REWARD,
        referrals,
        totalReferrals: referrals.length,
        rewardsEarned,
        pendingRewards,
        user,
    }
}

export const validateReferralCode = async (userId, referralCode) => {
    if (!referralCode) {
        return {
            valid: false,
            message: "Please enter a referral code",
        }
    }

    const code = referralCode.trim().toUpperCase()

    const referrer = await User.findOne({
        referralCode: code,
    })

    if (!referrer) {
        return {
            valid: false,
            message: "Invalid referral code",
        }
    }

    if (referrer._id.toString() === userId.toString()) {
        return {
            valid: false,
            message: "You cannot use your own referral code",
        }
    }

    const existingReferral = await Referral.findOne({
        referredUserId: userId,
    })

    if (existingReferral) {
        return {
            valid: false,
            message: "You have already used a referral code",
        }
    }

    return {
        valid: true,
        message: "Referral code is valid",
        referrerId: referrer._id,
        referralCode: code,
    }
}

export const applyReferralCode = async (userId, referralCode) => {
    const validation = await validateReferralCode(
        userId,
        referralCode
    )

    if (!validation.valid) {
        throw new Error(validation.message)
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new Error("User not found")
    }

    if (user.referredBy) {
        throw new Error("You have already used a referral code")
    }

    user.referredBy = validation.referrerId
    await user.save()

    await Referral.create({
        referrerId: validation.referrerId,
        referredUserId: userId,
        referralCode: validation.referralCode,
        status: "pending",
    })

    return {
        success: true,
        message: "Referral code applied successfully",
    }
}

export const processReferralReward = async (orderId) => {
    const order = await Order.findById(orderId)

    if (!order) {
        throw new Error("Order not found")
    }

    if (order.orderStatus !== "Delivered") {
        return null
    }

    const referredUserId = order.userId

    const referral = await Referral.findOne({
        referredUserId,
        status: "pending",
    })

    if (!referral) {
        return null
    }

    const previousQualifiedOrder = await Order.findOne({
        userId: referredUserId,
        _id: { $ne: orderId },
        orderStatus: "Delivered",
    })

    if (previousQualifiedOrder) {
        return null
    }

    const reward = REFERRAL_REWARD

    await creditWalletService(
        referral.referrerId,
        reward,
        "Referral reward for referring user",
        "referral_bonus"
    )

    await creditWalletService(
        referral.referredUserId,
        reward,
        "Referral welcome reward",
        "referral_bonus"
    )

    referral.status = "rewarded"
    referral.qualifyingOrderId = orderId
    referral.referrerReward = reward
    referral.referredUserReward = reward
    referral.rewardedAt = new Date()

    await referral.save()

    return referral
}


export const validateReferralCodeForSignup = async (referralCode) => {
    if (!referralCode) {
        return {
            valid: true
        }
    }

    const code = referralCode.trim().toUpperCase()

    const referrer = await User.findOne({
        referralCode: code
    })

    if (!referrer) {
        return {
            valid: false,
            message: "Invalid referral code"
        }
    }

    return {
        valid: true,
        message: "Referral code is valid",
        referrerId: referrer._id,
        referralCode: code
    }
}