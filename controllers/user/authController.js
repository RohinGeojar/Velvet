
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
            showFooter: true,
        })
    }

    
    return res.render("user/home", {
        title: "Home",
        error: null,
        showNavbar: true,
        showSidebar: false,

    })

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
        showFooter: false
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
        if (tempUser?.linked) {
            req.session.user = user._id;
            return res.status(200).json({
                success: true,
                message: "Account linked successfully"
            });
        }

        req.session.tempUser = tempUser



        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) return reject(err);
                resolve()   
            })
        })

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            email
        })

    } catch (err) {
        console.error(err)

        return res.status(400).json({
            success: false,
            message: err.message || "Signup failed"
        })
    }
}

//verifyOtp
export const verifyOtp = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4 } = req.body
        const OTP = otp1 + otp2 + otp3 + otp4
        const tempUser = req.session.tempUser
        if (OTP == '' || null) {
            return res.status(400).json({
                success: false,
                message: "Please enter the OTP."
            })
        }


        if (!tempUser) {
            return res.status(400).json({
                success: false,
                message: "Session expired. Please register again."
            })
        }

        const email = tempUser.email

        const otpDoc = await Otp.findOne({ email })


        if (!otpDoc) {
            return res.status(400).json({
                success: false,
                message: "OTP expired"
            })
        }

        const isMatch = await bcrypt.compare(OTP, otpDoc.otp)

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }


        const user = await User.create({
            ...tempUser,
            isVerified: true
        })

        req.session.user = user._id

        await Otp.deleteMany({ email })
        delete req.session.tempUser;


        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        })

    } catch (err) {
        console.error(err)

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
};

// resend otp 

export const resendSignupOtp = async (req, res) => {
    try {
        console.log("resendSignupOtp hit")
        const tempUser = req.session.tempUser


        if (!tempUser) {
            return res.status(400).json({
                success: false,
                message: "Session expired. Please register again."
            })
        }

        const email = tempUser.email
        console.time("Resend OTP");

console.log("Before sendOtpService");

        await sendOtpService(email)
        console.log("After sendOtpService");

console.timeEnd("Resend OTP");

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully"
        })

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Failed to resend OTP"
        })
    }
}
//loadLogin

export const loadLogin = async (req, res) => {
    try {
        res.render("auth/login", {
            title: "Login", error: null,
            showNavbar: false,
            showSidebar: false,
            showFooter: false
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
                showSidebar: false,
                showFooter: false
            })
        }
        if (user.isBlocked) {
            return res.render("auth/login", {
                title: "Login",
                error: "Your account Is Blocked",
                showNavbar: false,
                showSidebar: false,
                showFooter: false
            })
        }
        if (!user.password) {
            return res.render("auth/login", {
                title: "Login",
                error: "This account was created using Google. Please login with Google.",
                showNavbar: false,
                showSidebar: false,
                showFooter: false
            });
        }

        const isMatch = await comparePassword(password, user.password)

        if (!isMatch) {
            return res.render("auth/login", {
                title: "Login",
                error: "Invalid password",
                showNavbar: false,
                showSidebar: false,
                showFooter: false
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
            showSidebar: false,
            showFooter: false
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
            showFooter: false
        })
    } catch (error) {
        console.error(error)
    }
}

// SEND OTP

export const sendForgotOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        req.session.resetEmail = email;

        await sendOtpService(email);


        return res.json({ requireOtp: true });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message || "Server error" });
    }
};

// verify forgot otp
export const verifyForgotOtp = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4 } = req.body;
        const enteredOtp = otp1 + otp2 + otp3 + otp4;

        const email = req.session.resetEmail;

        const otpDoc = await Otp.findOne({ email }).sort({ createdAt: -1 });


        if (!otpDoc) {
            return res.status(400).json({ message: "OTP expired" });
        }

        const isMatch = await bcrypt.compare(enteredOtp, otpDoc.otp);


        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }


        req.session.otpVerified = true;
        console.log("OTP verified")

        return res.json({ success: true });


    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};
export const loadResetPassword = (req, res) => {
    if (!req.session.otpVerified) {
        return res.redirect("/forgotPassword");
    }

    return res.render("auth/resetPassword", {
        title: "Reset Password",
        error: null,
        showFooter: false
    });
};

//reset password
export const resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        console.log("pass", password)
        if (password.length < 6) {
            return res.render("auth/resetPassword", {
                title: "Reset Password",
                error: "Password must contain altealst 6 characters",
                showFooter: false
            });
        }
        if (!password || !confirmPassword) {
            return res.render("auth/resetPassword", {
                title: "Reset Password",
                error: "All fields are required",
                showFooter: false
            });
        }

        if (password !== confirmPassword) {
            return res.render("auth/resetPassword", {
                title: "Reset Password",
                error: "Passwords do not match",
                showFooter: false
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







