import { MessagePort } from "worker_threads";
import User from "../../models/user.js";
import { AppError } from "../../utils/AppError.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import bcrypt from "bcryptjs";
import { MESSAGES } from "../../utils/messages.js";
import { STATUS } from "../../utils/statusCodes.js";

export const getUserProfile = async (userId) => {
    return await User.findById(userId)
    if (!user) {
        throw new AppError(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
    }
}

export const updateUserProfile = async (userId, data) => {
    const { firstName, lastName, email, phone } = data;

    const existing = await User.findOne({ email });

    if (existing && existing._id.toString() !== userId.toString()) {
        throw new AppError(MESSAGES.EMAIL_IN_USE,STATUS.BAD_REQUEST);
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { firstName, lastName, email, phone },
        { new: true }
    );
    

    return updatedUser;
}

//change password

export const changePasswordService = async (userId, data) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    if (newPassword !== confirmPassword) {
        throw new AppError(MESSAGES.PASSWORDS_NOT_MATCH,STATUS.BAD_REQUEST)
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
    }

    const isMatch = await comparePassword(currentPassword, user.password);

    if (!isMatch) {
        throw new AppError(MESSAGES.CURRENT_PASSWORD_INCORRECT,STATUS.BAD_REQUEST);
    }

   const isSame = await comparePassword(newPassword, user.password);

    if (isSame) {
        throw new AppError(MESSAGES.PASSWORD_SAME_AS_OLD,STATUS.BAD_REQUEST);
    }

    const hashedPassword = await hashPassword(newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
        password: hashedPassword
    });

    return true;
};