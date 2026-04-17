import User from "../../models/user.js";
import {
    changePasswordService,
    getUserProfile,
    updateUserProfile
} from "../../services/user/profileService.js";
import fs from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";


// ================= LOAD PROFILE =================
export const loadProfile = async (req, res) => {
    try {
        const user = await getUserProfile(req.session.user);

        if (!user) return res.redirect("/login");

        return res.render("user/profile", {
            user,
            showNavbar: true,
            showSidebar: true
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to load profile");
    }
};


// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
    try {
        const userId = req.session.user;

        const updatedUser = await updateUserProfile(userId, req.body);

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Profile updated successfully"
        });

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
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

        // 🔥 Create new file
        const filename = Date.now() + "." + type.ext;
        const filePath = path.join("public/uploads", filename);

        fs.writeFileSync(filePath, req.file.buffer);

        const newImagePath = "/uploads/" + filename;

        // 🔥 Delete old image
        if (user.profileImage && user.profileImage.startsWith("/uploads/")) {
            const oldPath = path.join(process.cwd(), "public", user.profileImage);

            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // 🔥 Update DB
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