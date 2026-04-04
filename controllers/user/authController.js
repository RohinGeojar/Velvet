
import User from "../../models/user.js"
import Otp from "../../models/otp.js"
import { signupService } from "../../services/user/signupService.js"
import { comparePassword, hashPassword } from "../../utils/hash.js"
import { sendOtpService } from "../../services/user/otpService.js"


export const loadHome = async (req,res) => {
    if(!req.session.user){
        return res.render("user/home", { 
        title: "Home" ,
        error:"no user"});
    }
    return res.render("user/home", { 
        title: "Home" ,
        error:null
    });
    
}


//loadSignup

export const loadRegister = (req, res) => {
    if(req.session.user){
        return res.redirect("/")
    }
    console.log("🔥 register page hit");
    return res.render("auth/register", { title: "Create Account", error:null , showOtpModal: false })
}

//signup
export const signup = async (req, res) => {

    try {
        const { firstName, email, password, confirmPassword } = req.body

        if (!firstName || !email || !password || !confirmPassword) {
           return res.render("auth/register", {
                title: "Create Account",
                error: "All fields are required",
                showOtpModal: false
            })
        }
        if (password !== confirmPassword) {
            return res.render("auth/register", {
                title: "Create Account",
                error: "Password do not match",
                showOtpModal: false
            })
        }


        const tempUser = await signupService(req.body)

        console.log(tempUser)
        req.session.tempUser = tempUser

        return res.render('auth/register', {
            title: "Create Account",
            email:email,
            error:null,
            otpAction: "/verifyOtp",
            showOtpModal: true
        })

    }
    catch (err) {
        console.log(err)
        return res.render("auth/register", {
            title: "Create Account",
            showOtpModal: false,
            error: err.message
        });
    }

}

//verifyOtp
export const verifyOtp = async (req, res) => {
    try {

        const { otp1, otp2, otp3, otp4 } = req.body
        const OTP = otp1 + otp2 + otp3 + otp4
        console.log(OTP)    

        const tempUser = req.session.tempUser

        if(!tempUser ){
            return res.redirect("/register")
        }

        console.log("tempuser",tempUser)
     
       
        const email = tempUser.email

        const otpDoc = await Otp.findOne({ email })

        if (!otpDoc) {
            req.flash("error", "OTP expired");
            return res.redirect("/forgotPassword")
        }
        if (otpDoc.otp !== OTP) {
            return res.send("invalid OTP")
        }

        //create user
       
        const user = await User.create({...tempUser,isVerified: true})
   

        req.session.user = user._id

        await Otp.deleteMany({ email })
        delete req.session.tempUser

        res.redirect("/")

        console.log("Login Successful")

    } catch (err) {
        console.error(err)
    }
}

//loadLogin

export const loadLogin = async (req, res) => {
    try {
        res.render("auth/login", { title: "Login",error:null })

    } catch (err) {
        console.error(err)
    }
}
//LOGIN

export const login = async(req,res) =>{
    try{
        if(req.session.user){
        return res.redirect("/")
    }
    const {email,password}= req.body

    const user = await User.findOne({email})
    
    if(!user){
        return res.render("auth/login",{
            title:"Login",
            error:"User Not Found"
        })
    }
    if(user.isBlocked){
        return res.render("auth/login",{
            title:"Login",
            error:"User Is Blocked"
        })
    }
    const isMatch = await comparePassword(password,user.password)

    if (!isMatch) {
            return res.render("auth/login", {
                title: "Login",
                error: "Invalid password"
            });
        }

        req.session.user= user._id
    
    return res.redirect("/")

    }catch(err){
        console.error(err);

        return res.render("auth/login", {
            title: "Login",
            error: "Something went wrong"
        });
    }
}
//LOAD FORGOT PASSWORD
export const loadForgotPassword = async(req,res) => {
    try{
         return res.render("auth/forgotPassword",{
            title:"Forgot password",
            error:null,
            showOtpModal:false
        })
    }catch(error){
        console.error(error)
    }
}

// SEND OTP

export const sendForgotOtp = async (req , res ) => {
    try{
        const {email} =req.body

        const user = await User.findOne({email})

        if(!user){
            return res.render("auth/forgotPassword" , {
                title:"Forgot password",
                error:"User NOt Found" ,
                showOtpModal:false 
            })
        }
        req.session.resetEmail = email

        await sendOtpService(email)

        return res.render("auth/forgotPassword" ,{
            title:"Forgot password",
            email:email,
            error:null,
            otpAction: "/verifyForgotOtp",
            showOtpModal:true
        })

    }catch(err){

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
    req.session.destroy()
    res.redirect("/")

}