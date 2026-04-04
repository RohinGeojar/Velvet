import Otp from "../../models/otp.js";
import { sendMail } from "../../utils/mailer.js"
import { generateOTP } from "../../utils/otpGeneration.js"


export const sendOtpService = async (email)=> {
    const otp = generateOTP()
    console.log(otp)

    await Otp.deleteMany({email})

    const expiresAt = new Date(Date.now() + 30 * 1000)
   
    await Otp.create({
        email,
        otp,
        expiresAt
    })
    await sendMail(email,otp)
    return otp
}