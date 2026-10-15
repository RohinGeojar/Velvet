import Otp from "../../models/otp.js";
import { sendMail } from "../../utils/mailer.js"
import { generateOTP } from "../../utils/otpGeneration.js"
import bcrypt from "bcryptjs";



export const sendOtpService = async (email) => {

    const existingOtp = await Otp.findOne({ email });

    if (existingOtp && existingOtp.expiresAt > new Date()) {
        return {
            reused: true
        }
    }

    const otp = generateOTP();

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000)

    const hashedOtp = await bcrypt.hash(otp, 10)

    // Send first so the caller only opens the OTP screen after delivery succeeds.
    // Do not persist an OTP if the email provider rejects the message.
    await sendMail(email, otp)

    await Otp.findOneAndUpdate(
        { email },
        { otp: hashedOtp, expiresAt },
        {
            upsert: true,
            returnDocument: "after",
            setDefaultsOnInsert: true
        }
    )

    return { sent: true };
}