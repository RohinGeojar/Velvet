import { approveReturnService, getOrderDetails, getOrders, rejectReturnService, updateOrderStatus } from "../../services/admin/orderService.js"


export const loadOrderManagement = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1
        const search = req.query.search?.trim() || ""
        const limit = 5
        const status = req.query.status?.trim() || ""
        const sort = req.query.sort || ""
        const { orders,totalOrders,totalPages,stats } = await getOrders({
                page,
                limit,
                search,
                status,
                sort

            })
           

        res.render("admin/orderManagement", {
            orders,
            totalOrders,
            totalPages,
            stats,
            search,
            page,
            limit,
            search,
            status ,
            sort,
            activeNavLink: "Order",
            showFooter: false
        })
    } catch (error) {
        console.log("load order management error => ", error)
    }
}

export const loadOrderDetails = async (req, res) => {

    try {
        const orderId = req.params.id
       
        const order = await getOrderDetails(orderId)
        
        
        if(!order){
            return res.redirect("/OrderManagement")
        }
        
        res.render("admin/orderDetails",{
            order,
            activeNavLink: "Order",
            showFooter: false
        })
    
    } catch (error) {
       console.log("Load order details  admin error :",error ) 
    }
}



export const updateStatus = async (req,res) => {
    try {
        console.log("update status hit")
        const orderId = req.params.id
        const {status }= req.body

        const result = await updateOrderStatus(orderId,status)

        return res.json(result)
    } catch (error) {
        console.log("update Status admin error  " ,error)
        return res.json({
            success: false,
            message: "Something went wrong"
        })
    }
}




export const approveReturn = async (req, res) => {
    try {
         console.log("Approve return hit")
        const { orderId, itemId } = req.params

        const result = await approveReturnService(orderId, itemId)

        if (!result.success) {
            console.log(result)
            return res.status(400).json(result)
        }

        return res.json(result)

    } catch (error) {

        console.log("approve return  error", error)

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })

    }
}


export const rejectReturn = async (req, res) => {
    try {

        const { orderId, itemId } = req.params

        const { reason } = req.body

        const result = await rejectReturnService(orderId,itemId,reason)

        if (!result.success) {
            return res.status(400).json(result)
        }

        return res.json(result)

    } catch (error) {

        console.log("reject return  error", error)

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })

    }
}