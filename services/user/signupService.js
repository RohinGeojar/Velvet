import User from "../../models/user.js"
import { sendOtpService } from "./otpService.js"
import { hashPassword } from "../../utils/hash.js"

export const signupService = async (data) => {

    const { email } = data

    const existingUser =await User.findOne({ email })
    if (existingUser && existingUser.isVerified) {
        throw new Error("User already exists. Please login.")
    }
    if(existingUser && !existingUser.isVerified) {
        await sendOtpService(email);

        return {
            ...data,
            password: existingUser.password 
        };
    }


    const hashedPassword = await hashPassword(data.password)
    const tempUser = {
        ...data,
        password: hashedPassword
    }

    await sendOtpService(email)
    return tempUser

}