import User from "../models/user.js";
import passport from "passport";

export const isLogged = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/");
    }
    next()
}

export const userAuth = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login");
        }

        const user = await User.findById(req.session.user);

        if (!user || user.isBlocked) {
            req.session.destroy(() => {
                return res.redirect("/login");
            });
             return;
        }

        req.user = user;
        next();

    } catch (error) {
        console.log("error in auth mw", error);
        return res.redirect("/login");
    }

}

export const googleAuth = passport.authenticate("google", { scope: ["profile", "email"] })

export const googleAuthCallback = [
    passport.authenticate("google", {
        failureRedirect: "/login",
    }),
    (req, res) => {
        req.session.user = req.user;
        res.redirect("/");
    },
];