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

export const googleAuth = passport.authenticate("google", { scope: ["profile", "email"],prompt: "select_account" })

export const googleAuthCallback = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {

    if (err) return next(err);

    if (!user) {
      
      return res.render("auth/login", {
        title: "Login",
        error: info?.message || "Google login failed",
        showNavbar: false,
        showSidebar: false,
        showFooter:false
      });
    }

   
    req.session.user = user._id;
    return res.redirect("/");

  })(req, res, next);
};