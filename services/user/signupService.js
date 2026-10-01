import User from "../../models/user.js"
import { sendOtpService } from "./otpService.js"
import { hashPassword } from "../../utils/hash.js"
import Order from "../../models/order.js"

export const signupService = async (data) => {

    const { email,password } = data

    const existingUser =await User.findOne({ email })
    if (existingUser && existingUser.googleId && !existingUser.password) {
        
        const hashedPassword = await hashPassword(password);
        
        existingUser.password = hashedPassword;
        await existingUser.save();
        
        return { linked: true }; 
    }
    if(existingUser && !existingUser.isVerified) {
        await sendOtpService(email);
        
        return {
            ...data,
            password: existingUser.password 
        };
    }
    
    if (existingUser && existingUser.isVerified) {
        throw new Error("User already exists. Please login.")
    }
    
    const hashedPassword = await hashPassword(password)
    const tempUser = {
        ...data,
        password: hashedPassword
    }

    await sendOtpService(email)
    return tempUser

}




const excludedStatuses = ["Cancelled", "Returned"]

export const getHomeBestSellers = async () => {

    const bestSellers = await Order.aggregate([

        {
            $unwind: "$items"
        },

        {
            $match: {
                "items.status": {
                    $nin: excludedStatuses
                }
            }
        },

        {
            $group: {

                _id: "$items.productId",

                totalSold: {
                    $sum: "$items.quantity"
                }

            }
        },


        {
            $sort: {
                totalSold: -1
            }
        },

  
        {
            $limit: 3
        },

        {
            $lookup: {

                from: "products",

                localField: "_id",

                foreignField: "_id",

                as: "product"

            }
        },

        {
            $unwind: "$product"
        },


        {
            $project: {

                _id: "$product._id",

                productName: "$product.productName",

                slug: "$product.slug",

                variants: "$product.variants",

                totalSold: 1

            }
        }

    ])

    return bestSellers
}