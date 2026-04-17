import User from "../../models/user.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import bcrypt from "bcryptjs";

export const getUserProfile = async (userId) => {
    return await User.findById(userId)
}

export const updateUserProfile = async (userId, data) => {
    const { firstName, lastName, email, phone } = data;

    const existing = await User.findOne({ email });

    if (existing && existing._id.toString() !== userId) {
        throw new Error("Email already in use");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { firstName, lastName, email, phone },
        { new: true }
    );
    console.log("user updated")

    return updatedUser;
}

//change password

export const changePasswordService = async (userId, data) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const isMatch = await comparePassword(currentPassword, user.password);

    if (!isMatch) {
        throw new Error("Current password is incorrect");
    }

    const isSame = await bcrypt.compare(newPassword, user.password);

    if (isSame) {
        throw new Error("New password cannot be same as old password");
    }

    const hashedPassword = await hashPassword(newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
        password: hashedPassword
    });

    return true;
};