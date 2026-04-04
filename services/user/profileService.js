import User from "../../models/user.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";

export const getUserProfile = async (userId) => {
    return await User.findById(userId)
}

export const updateUserProfile = async (userId, data) => {
    const { firstName, lastName, email,phone } = data;

    const existing = await User.findOne({ email });

    if (existing && existing._id.toString() !== userId) {
        throw new Error("Email already in use");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { firstName, lastName, email ,phone},
        { new: true }
    );
    console.log("user updated")

    return updatedUser;
}

//change password

export const changePasswordService = async (userId, data) => {
    const { currentPassword, newPassword } = data;

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const isMatch = await comparePassword(currentPassword, user.password);

    if (!isMatch) {
        throw new Error("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;

    await user.save();

    return user;
};