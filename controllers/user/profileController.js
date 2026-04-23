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

export const loadOverview = async (req, res) => {
    try {
        
        if (!req.session.user) {
            return res.redirect("/login");
        }
        const userId = req.session.user;


      
        const user = await User.findById(userId).lean();
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
        const user = await User.findById(req.session.user);

        // 🔥 EMAIL CHANGED
        if (req.body.email && req.body.email !== user.email) {

            user.tempEmail = req.body.email;
            await user.save();


            await sendOtpService(user.tempEmail);

            return res.json({
                requireOtp: true
            });
        }

        // ✅ normal update
        await updateUserProfile(user._id, req.body);

        res.json({ message: "Profile updated" });

    } catch (err) {
        console.log("🔥 FULL ERROR:", err);  // 👈 ADD THIS
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
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // 🔥 Strict file validation
        const type = await fileTypeFromBuffer(req.file.buffer);

        if (!type || !type.mime.startsWith("image/")) {
            return res.status(400).json({ message: "Only image files allowed" });
        }

        const userId = req.session.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }


        const filename = Date.now() + "." + type.ext;


        const uploadDir = path.join("public/uploads");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);

        await fs.promises.writeFile(filePath, req.file.buffer);

        const newImagePath = "/uploads/" + filename;


        if (user.profileImage && user.profileImage.startsWith("/uploads/")) {
            const oldPath = path.join(process.cwd(), "public", user.profileImage);

            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }


        await User.findByIdAndUpdate(userId, {
            profileImage: newImagePath
        });

        return res.status(200).json({
            message: "Profile image updated",
            imagePath: newImagePath
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Upload failed"
        });
    }
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