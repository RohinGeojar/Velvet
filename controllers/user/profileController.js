import User from "../../models/user.js";
import { changePasswordService, getUserProfile, updateUserProfile } from "../../services/user/profileService.js";

export const loadProfile = async (req, res) => {
    try {
        const user = await getUserProfile(req.session.user);

         const success = req.session.success;
        const error = req.session.error;

        delete req.session.success;
        delete req.session.error;

        return res.render("user/profile", {
            user,
            success,
            error
    });

    } catch (err) {
        console.error(err);
    }
}

export const updateProfile = async (req, res) => {
    try {
        
        const updatedUser = await updateUserProfile(
            req.session.user,
            req.body
        );
        console.log(updatedUser)
        req.session.success = "Profile updated";
        return res.redirect("/profile")

    } catch (err) {
        const user = await User.findById(req.session.user);

        if (!user) {
            return res.redirect("/login");
        }

        return res.render("user/profile", {
            title: "My Profile",
            user,
            error: err.message,
            success: null
        });
    }
};

export const changePassword = async (req, res) => {
    console.log("BODY:", req.body);
console.log("SESSION:", req.session.user);
    try {
       const user = await changePasswordService(req.session.user, req.body);

        return res.render("user/profile", {
            user,
            success: "Password updated successfully",
            error: null
        });

    } catch (err) {
        const u=req.session.user
        const user = await User.findOne({u})
        return res.render("user/profile", {
            user,
            success:null,
            error: err.message
        });
    }
};