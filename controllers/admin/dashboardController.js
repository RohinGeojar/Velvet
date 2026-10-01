import { getDashboardDataService} from "../../services/admin/dashboardService.js"

export const loadDashBoard = async (req, res) => {
    try {
          console.log("Dashboard hit")
        if (!req.session.admin) return res.redirect("/adminAuth/login")


        return res.render("admin/dashboard", { activeNavLink: "Dashboard", layout: "partials/admin/adminLayout" })
    } catch (error) {
        console.log("Dashboard loading error:", error)
    }
}

export const getDashboardData = async (req, res, next) => {
    try {
        const { filter = "yearly", startDate, endDate } = req.query
        const data = await getDashboardDataService(filter, startDate, endDate)
        

        return res.json({ success: true, data })
    } catch (error) {
        next(error)
    }
}