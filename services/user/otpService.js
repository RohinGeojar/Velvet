import Otp from "../../models/otp.js";
import { sendMail } from "../../utils/mailer.js"
import { generateOTP } from "../../utils/otpGeneration.js"
import bcrypt from "bcryptjs";


// export const sendOtpService = async (email)=> {
//     const otp = generateOTP()
//     console.log(otp)

//     await Otp.deleteMany({email})

//     const expiresAt = new Date(Date.now() + 30 * 1000)
   
//     await Otp.create({
//         email,
//         otp,
//         expiresAt
//     })
//     await sendMail(email,otp)
//     return otp
// }
export const sendOtpService = async (email) => {

    const existingOtp = await Otp.findOne({ email });

    if (existingOtp && existingOtp.expiresAt > new Date()) {
       return {
    reused: true
  };
    }

    const otp = generateOTP();

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    const hashedOtp = await bcrypt.hash(otp, 10);
        console.log("otp :",otp)
    await Otp.findOneAndUpdate(
        { email },
        { otp:hashedOtp, expiresAt },
        { upsert: true, new: true }
    );

    await sendMail(email, otp);

    return otp;
};