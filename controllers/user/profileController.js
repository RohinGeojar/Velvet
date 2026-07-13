import User from "../../models/user.js";
import {
    changePasswordService,
    getUserProfile,
    updateUserProfile
} from "../../services/user/profileService.js";
import fs from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import { sendOtpService } from "../../services/user/otpService.js"
import Otp from "../../models/otp.js";
import bcrypt from "bcryptjs";
import Address from "../../models/address.js";
import { capitalizeName } from "../../utils/capitalizer.js";
import { deleteFromCloudinary } from "../../utils/cloudinaryDelete.js";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload.js";

export const loadOverview = async (req, res) => {
    try {
        
        
        const userId = req.session.user;


      
        const user = await User.findById(userId).lean()
        console.log(req.session.user)
     
       
        const defaultAddress = await Address.findOne({
            user: userId,
            isDefault: true
        }).lean();
        console.log(defaultAddress)

        return res.render("user/overview", {
            user,
            defaultAddress,
            currentPage: "overview",
            showNavbar: true,
            showSidebar: true,
            
        });

    } catch (err) {
        console.error("Overview Error:", err);
        res.status(500).send("Server Error");
    }
};
// ================= LOAD PROFILE =================
export const loadProfile = async (req, res) => {
    try {
        const user = await getUserProfile(req.session.user);

        if (!user) return res.redirect("/login");

        return res.render("user/profile", {
            user,
            showNavbar: true,
            showSidebar: true,
            currentPage: "profile"
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to load profile");
    }
};


// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
    try {
        let   { firstName, lastName } = req.body

        firstName= capitalizeName(firstName)
        lastName= capitalizeName(lastName)

        const data = {firstName , lastName ,...req.body}

        const user = await User.findById(req.session.user);

       
        if (req.body.email && req.body.email !== user.email) {

            user.tempEmail = req.body.email;
            await user.save();


          const otpResult=  await sendOtpService(user.tempEmail);

            return res.json({
                requireOtp: true,
                reused: otpResult?.reused || false
            });
        }

        
        await updateUserProfile(user._id,body);

        res.json({ message: "Profile updated" });

    } catch (err) {
        console.log("FULL ERROR:", err); 
        res.status(400).json({ message: err.message });
    }
};

// ================= CHANGE PASSWORD =================
export const changePassword = async (req, res) => {
    try {
        await changePasswordService(req.session.user, req.body);

        return res.status(200).json({
            message: "Password updated successfully"
        });

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};


// ================= UPLOAD PROFILE PHOTO =================
export const uploadProfilePhoto = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded"
        });
    }

    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }


    if (user.profileImage?.public_id) {
        await deleteFromCloudinary(user.profileImage.public_id);
    }


    user.profileImage = {
        url: req.file.path,
        public_id: req.file.filename
    };

    await user.save();

    return res.status(200).json({
        success: true,
        message: "Profile image updated",
        imagePath: req.file.path
    });
};

export const resendEmailOtp = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);

        if (!user || !user.tempEmail) {
            return res.status(400).json({ message: "Invalid request" });
        }

        await sendOtpService(user.tempEmail);

        res.json({ success: true });

    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Error resending OTP" });
    }
};


export const verifyEmailChange = async (req, res) => {
    try {
        console.log("VERIFY HIT");
        const user = await User.findById(req.session.user);

        const enteredOtp =
            req.body.otp1 +
            req.body.otp2 +
            req.body.otp3 +
            req.body.otp4;

        const record = await Otp.findOne({ email: user.tempEmail })
            .sort({ createdAt: -1 });

        if (!record) {
            return res.status(400).json({ message: "OTP not Found" });
        }

        if (record.expiresAt < new Date()) {
            return res.status(400).json({ message: "OTP Expired" });
        }

        const isMatch = await bcrypt.compare(enteredOtp, record.otp);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // ✅ update email
        const tempEmail = user.tempEmail;

        user.email = tempEmail;
        user.tempEmail = null;

        await user.save();
        await Otp.deleteOne({ email: tempEmail });
        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.redirect("/error");
    }
};