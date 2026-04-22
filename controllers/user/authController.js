
import User from "../../models/user.js"
import Otp from "../../models/otp.js"
import { signupService } from "../../services/user/signupService.js"
import { comparePassword, hashPassword } from "../../utils/hash.js"
import { sendOtpService } from "../../services/user/otpService.js"
import bcrypt from "bcryptjs"


export const loadHome = async (req, res) => {
    if (!req.session.user) {
        return res.render("user/home", {
            title: "Home",
            error: "no user",
            showNavbar: true,
            showSidebar: false,
            showFooter:true,
        });
    }
    return res.render("user/home", {
        title: "Home",
        error: null,
        showNavbar: true,
        showSidebar: false,
        
    });

}

//loadSignup

export const loadRegister = (req, res) => {
    if (req.session.user) {
        return res.redirect("/")
    }

    return res.render("auth/register", {
        title: "Create Account", error: null, showOtpModal: false,
        showNavbar: false,
        showSidebar: false,
        showFooter:false
    })
}

//signup
export const signup = async (req, res) => {
    try {
        let { firstName, lastName, email, password, confirmPassword } = req.body;


        firstName = firstName?.trim();
        lastName = lastName?.trim();
        email = email?.trim();
        firstName = capitalizeName(req.body.firstName);
        lastName = capitalizeName(req.body.lastName);
        function capitalizeName(name) {
            if (!name) return "";
            return name
                .toLowerCase()
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        }

        if (!firstName || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }


        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }


        const cleanData = {
            firstName,
            lastName,
            email,
            password
        };

        const tempUser = await signupService(cleanData);

        req.session.tempUser = tempUser;

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            email
        });

    } catch (err) {
        console.error(err);

        return res.status(400).json({
            success: false,
            message: err.message || "Signup failed"
        });
    }
};

//verifyOtp
export const verifyOtp = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4 } = req.body;
        const OTP = otp1 + otp2 + otp3 + otp4;
        console.log(OTP)
        const tempUser = req.session.tempUser;


        if (!tempUser) {
            return res.status(400).json({
                success: false,
                message: "Session expired. Please register again."
            });
        }

        const email = tempUser.email;

        const otpDoc = await Otp.findOne({ email });


        if (!otpDoc) {
            return res.status(400).json({
                success: false,
                message: "OTP expired"
            });
        }

        const isMatch = await bcrypt.compare(OTP, otpDoc.otp);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }


        const user = await User.create({
            ...tempUser,
            isVerified: true
        });

        req.session.user = user._id;

        await Otp.deleteMany({ email });
        delete req.session.tempUser;


        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

// resend otp 

export const resendSignupOtp = async (req, res) => {
    try {
        const tempUser = req.session.tempUser;


        if (!tempUser) {
            return res.status(400).json({
                success: false,
                message: "Session expired. Please register again."
            });
        }

        const email = tempUser.email;


        await sendOtpService(email);

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully"
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Failed to resend OTP"
        });
    }
};
//loadLogin

export const loadLogin = async (req, res) => {
    try {
        res.render("auth/login", {
            title: "Login", error: null,
            showNavbar: false,
            showSidebar: false
        })

    } catch (err) {
        console.error(err)
    }
}
//LOGIN

export const login = async (req, res) => {
    try {
        if (req.session.user) {
            return res.redirect("/")
        }
        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.render("auth/login", {
                title: "Login",
                error: "User Not Found",
                showNavbar: false,
                showSidebar: false
            })
        }
        if (user.isBlocked) {
            return res.render("auth/login", {
                title: "Login",
                error: "Your account Is Blocked",
                showNavbar: false,
                showSidebar: false
            })
        }
        const isMatch = await comparePassword(password, user.password)

        if (!isMatch) {
            return res.render("auth/login", {
                title: "Login",
                error: "Invalid password",
                showNavbar: false,
                showSidebar: false
            });
        }

        req.session.user = user._id

        return res.redirect("/")

    } catch (err) {
        console.error(err);

        return res.render("auth/login", {
            title: "Login",
            error: "Something went wrong",
            showNavbar: false,
            showSidebar: false
        });
    }
}
//LOAD FORGOT PASSWORD
export const loadForgotPassword = async (req, res) => {
    try {
        return res.render("auth/forgotPassword", {
            title: "Forgot password",
            error: null,
            showOtpModal: false,
            showNavbar: false,
            showSidebar: false,
            showFooter:false
        })
    } catch (error) {
        console.error(error)
    }
}

// SEND OTP

export const sendForgotOtp = async (req, res) => {
    try {
        const { email } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.render("auth/forgotPassword", {
                title: "Forgot password",
                error: "User NOt Found",
                showOtpModal: false,
                showNavbar: false,
                showSidebar: false
            })
        }
        req.session.resetEmail = email

        await sendOtpService(email)

        return res.render("auth/forgotPassword", {
            title: "Forgot password",
            email: email,
            error: null,
            otpAction: "/verifyForgotOtp",
            showOtpModal: true,
            showNavbar: false,
            showSidebar: false
        })

    } catch (err) {
        console.log(err)
    }
}

// verify forgot otp
export const verifyForgotOtp = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4 } = req.body;

        const enteredOtp = otp1 + otp2 + otp3 + otp4;

        const email = req.session.resetEmail;
        console.log(email)

        const otpDoc = await Otp.findOne({ email });

        if (!otpDoc) {
            return res.send("OTP expired");
        }

        if (otpDoc.otp !== enteredOtp) {
            return res.send("Invalid OTP");
        }

        req.session.otpVerified = true;

        return res.redirect("/resetPassword");

    } catch (err) {
        console.error(err);
    }
};

export const loadResetPassword = (req, res) => {
    if (!req.session.otpVerified) {
        return res.redirect("/forgotPassword");
    }

    return res.render("auth/resetPassword", {
        title: "Reset Password",
        error: null
    });
};

//reset password
export const resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            return res.render("auth/resetPassword", {
                title: "Reset Password",
                error: "All fields are required"
            });
        }

        if (password !== confirmPassword) {
            return res.render("auth/resetPassword", {
                title: "Reset Password",
                error: "Passwords do not match"
            });
        }

        const email = req.session.resetEmail;

        if (!email) {
            return res.redirect("/forgotPassword");
        }

        const hashedPassword = await hashPassword(password);

        await User.updateOne(
            { email },
            { password: hashedPassword }
        );


        delete req.session.resetEmail;
        delete req.session.otpVerified;

        return res.redirect("/login");

    } catch (err) {
        console.error(err);
    }
};
//Logout

export const logout = (req, res) => {
    if (req.session.admin) {
        req.session.user = null
        return res.redirect("/")
    }
    req.session.destroy()
    return res.redirect("/")

}