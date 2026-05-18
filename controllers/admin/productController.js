import Category from "../../models/categoryModel.js"
import Product from "../../models/productModel.js"
import { createProduct } from "../../services/admin/productService.js"
import { productSchema } from "../../validators/productValidator.js"


export const loadProducts = async (req, res) =>{
    try {
    

        res.render("admin/productManagement",{
            activeNavLink:"Products",
            layout: false,
           
        })
        
    } catch (error) {
        console.log(error)
    }
}

export const loadAddProducts = async (req, res) =>{
    try {
        const categories = await Category.find({ isDeleted: false})
    

        res.render("admin/addProduct",{
            activeNavLink:"Products",
            layout: false,
            categories
           
        })
        
    } catch (error) {
        console.log(error)
    }
}


export  const addProduct = async (req, res) => {
    try {
        console.dir(req.body,{depth:null})
        const {error,value  } =  productSchema.validate(req.body, {
    abortEarly: false
})

        if(error){
            return res.status(400).json({
                success:false,
                errors:error.details
            })
        }
        if (!req.files|| req.files.length === 0) {

            return res.status(400).json({
                success: false,
                message: "Category image is required"
            });
        }

        const product = await createProduct(
            value,
            req.files
        )

        return res.status(201).json({
            success:true,
            message: "Product added successfully"
        })
         
    } catch (error) {
        console.log(error)
    }
}

 