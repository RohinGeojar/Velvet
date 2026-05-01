import User from "../../models/user.js"
import { sendOtpService } from "./otpService.js"
import { hashPassword } from "../../utils/hash.js"

export const signupService = async (data) => {

    const { email,password } = data

    const existingUser =await User.findOne({ email })
    if (existingUser && existingUser.googleId && !existingUser.password) {
        
        const hashedPassword = await hashPassword(password);
        
        existingUser.password = hashedPassword;
        await existingUser.save();
        
        return { linked: true }; // special response
    }
    if(existingUser && !existingUser.isVerified) {
        await sendOtpService(email);
        
        return {
            ...data,
            password: existingUser.password 
        };
    }
    
    if (existingUser && existingUser.isVerified) {
        throw new Error("User already exists. Please login.")
    }
    
    const hashedPassword = await hashPassword(password)
    const tempUser = {
        ...data,
        password: hashedPassword
    }

    await sendOtpService(email)
    return tempUser

}