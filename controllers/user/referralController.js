import { ensureReferralCode, getReferralDetails,validateReferralCode,applyReferralCode,} from "../../services/user/referralService.js"

export const getReferralPage = async (req, res, next) => {
    try {
        const userId = req.user._id
        const referralData = await getReferralDetails(userId)
        const referralLink = `${req.protocol}://${req.get("host")}/register?ref=${referralData.referralCode}`

        res.render("user/referral", {
            referralData,
            referralLink,
            error: null,
            showNavbar: true,
            showSidebar: true,
            currentPage: "referral",
            user: referralData.user
        })
    } catch (error) {
        next(error)
    }
}

export const getReferralCode = async (req, res, next) => {
    try {
        const userId = req.user._id

        const referralCode = await ensureReferralCode(userId)

        res.status(200).json({
            success: true,
            referralCode,
        })
    } catch (error) {
        next(error)
    }
}

export const checkReferralCode = async (req, res, next) => {
    try {
        const userId = req.user._id
        const { referralCode } = req.body

        const result = await validateReferralCode( userId,  referralCode )

        if (!result.valid) {
            return res.status(400).json({
                success: false,
                message: result.message,
            })
        }

        res.status(200).json({
            success: true,
            message: result.message,
        })
    } catch (error) {
        next(error)
    }
}

export const useReferralCode = async (req, res) => {
    try {
        const userId = req.user._id
        const { referralCode } = req.body

        const result = await applyReferralCode( userId, referralCode )

        res.status(200).json(result)
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        })
    }
}