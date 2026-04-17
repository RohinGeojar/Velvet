import User from "../../models/user.js"
import bcrypt from "bcryptjs"
import { comparePassword } from "../../utils/hash.js"

export const loadAdminLogin = async (req, res) => {
    try {
       
        res.render("admin/login", {layout:false, error: null })

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
            return res.render("admin/login", {
                error: "Admin Not Found"
                ,layout:false
            })
        }

        if(admin.role !== "admin"){
            return res.render("admin/login",{
            error:"Not admin"
        })
        }
        const isMatch = await comparePassword(password,admin.password)

        if (!isMatch) {
            return res.render("admin/login", {
                error: "Invalid password"
            });
        }
        req.session.admin = admin._id

        res.redirect('/adminAuth/dashBoard')

    } catch (error) {
        console.log("Admin Login error : ", error)
    }
}


export const loadDashBoard = async(req,res) =>{
    try {
        if(!req.session.admin){
            return res.redirect("/adminAuth/login")
        }
        return res.render("admin/dashboard",{activeNavLink: "Dashboard",layout: "partials/admin/adminLayout"})
    } catch (error) {
        console.log("Dashboard loading error : ", error)
    }
}

    export const logout = (req, res) => {
        if(req.session.user){
            req.session.admin =null
           return res.redirect("/adminAuth/login")
        }
        req.session.destroy()
        return res.redirect("/adminAuth/login")
    }