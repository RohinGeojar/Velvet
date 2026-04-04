import User from "../models/user.js";

export const userAuth = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login");
        }

        const user = await User.findById(req.session.user);

        if (!user) {
            delete req.session.user;
            return res.redirect("/login");
        }

        if (user.isBlocked) {
            delete req.session.user;
            return res.redirect("/login");
        }

        req.user = user;
        next();

    } catch (error) {
        console.log("error in auth mw", error);
        return res.redirect("/login");
    }

} 