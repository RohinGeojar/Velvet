import User from "../../models/user.js"
import bcrypt from "bcryptjs"
import { comparePassword } from "../../utils/hash.js"
import { sendOtpService } from "../../services/user/otpService.js"
import Otp from "../../models/otp.js"

export const loadAdminLogin = async (req, res) => {
    try {

        res.render("admin/login", { layout: false, error: null })

    } catch (err) {
        console.error("loadAdminLogin error ", err)
    }
}

export const adminLogin = async (req, res) => {
    try {

        if (req.session.admin) {
            return res.redirect("/adminAuth/dashboard")
        }

        const { email, password } = req.body

        const admin = await User.findOne({ email })


        if (!admin) {
             return res.status(400).json({ message: "Admin not found" });
        }

        if (admin.role !== "admin") {
            return res.status(400).json({ message: "Not admin" });
        }
        const isMatch = await comparePassword(password, admin.password)

        if (!isMatch) {
           return res.status(400).json({ message: "Invalid password" });
        }
        req.session.admin = admin._id

        return res.json({ success: true });

    } catch (error) {
        console.log("Admin Login error : ", error)
    }
}


export const loadDashBoard = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect("/adminAuth/login")
        }
        return res.render("admin/dashboard", { activeNavLink: "Dashboard", layout: "partials/admin/adminLayout" })
    } catch (error) {
        console.log("Dashboard loading error : ", error)
    }
}

export const logout = (req, res) => {
      req.session.admin = null
    return res.redirect("/adminAuth/login")
}


export const loadAdminForgot = async (req, res) => {
    try {
        return res.render("admin/adminForgotPassword", {
            layout: false
        })

    } catch (error) {
        console.log(error)
    }
}

export const sendAdminOtp = async (req, res) => {
    try {
        const { email } = req.body
        const admin = await User.findOne({ role: "admin", email })

        if (!admin) {
            console.log("Admin Not Found")
            return res.status(400).json({ message: "Admin Not Found" })
        }
        req.session.adminResetEmail = email

        await sendOtpService(email)

        return res.json({ requireOtp: true })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            message: error.message || "Something went wrong"})
    }
}

export const verifyAdminOtp = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4 } = req.body;

    const enteredOtp = otp1 + otp2 + otp3 + otp4;
    const email = req.session.adminResetEmail;
    console.log(enteredOtp,"entered otp")
    const otpDoc = await Otp.findOne({ email });

    if (!otpDoc) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(enteredOtp, otpDoc.otp);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    req.session.adminOtpVerified = true;

    return res.json({ success: true }); 

  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Server error" });
  }
};

export const loadAdminReset = async (req,res) => {
    try {
    if (!req.session.adminOtpVerified) {
      return res.redirect("/adminAuth/forgotPassword");
    }

    return res.render("admin/resetPassword", {
      layout: false
    });
    } catch (error) {
        console.log(error)
    }
}

export const resetAdminPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!req.session.adminOtpVerified) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const email = req.session.adminResetEmail;

    const hashed = await bcrypt.hash(password, 10);

    await User.updateOne({ email, role: "admin" }, { password: hashed });

   
    req.session.adminResetEmail = null;
    req.session.adminOtpVerified = null;

    return res.json({ success: true });

  } catch (err) {
    console.log("password reset admin error",err)
    return res.status(500).json({ message: "Failed to reset password" });
  }
}
