import User from "../models/user.js";
import passport from "passport"
import { applyReferralCode } from "../services/user/referralService.js";

export const isLogged = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/");
    }
    next()
}

export const userAuth = async (req, res, next) => {
    try {
        if (!req.session.user) {
            
             const isAjax =
                req.xhr ||
                req.headers["x-requested-with"] ===
                "XMLHttpRequest";

            if (isAjax) {

                return res.status(401).json({
                    success: false,
                    loginRequired: true,
                    message:
                        "Please login to continue"
                });
            }

            return res.redirect("/login");
        }

        const user = await User.findById(req.session.user);

        if (!user || user.isBlocked) {
            req.session.destroy(() => {
                return res.redirect("/login");
            })
             return;
        }

        req.user = user
        next();

    } catch (error) {
        console.log("error in auth mw", error);
        return res.redirect("/login");
    }

}

export const googleAuth = (req, res, next) => {

    const referralCode = req.query.ref?.trim().toUpperCase()

    if (referralCode) {
        req.session.googleReferralCode = referralCode
    }

    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account"
    })(req, res, next)
}

export const googleAuthCallback = (req, res, next) => {

    passport.authenticate("google", async (err, user, info) => {

        if (err) return next(err)

        if (!user) {
            return res.render("auth/login", {
                title: "Login",
                error: info?.message || "Google login failed",
                showNavbar: false,
                showSidebar: false,
                showFooter: false
            })
        }

        try {

            const referralCode = req.session.googleReferralCode

            req.session.user = user._id

           
            if (referralCode) {

                try {

                    await applyReferralCode(
                        user._id,
                        referralCode
                    )

                } catch (referralError) {

                    console.error(
                        "Google referral could not be applied:",
                        referralError.message
                    )
                }
            }

            delete req.session.googleReferralCode

            await new Promise((resolve, reject) => {
                req.session.save(err => {
                    if (err) return reject(err)
                    resolve()
                })
            })

            return res.redirect("/")

        } catch (error) {

            console.error(
                "Google authentication callback error:",
                error
            )

            return res.redirect("/login")
        }

    })(req, res, next)
}