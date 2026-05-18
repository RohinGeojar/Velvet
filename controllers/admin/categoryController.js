import { createCategory, getCategories, updateCategory } from "../../services/admin/categoryService.js";
import Category from "../../models/categoryModel.js"
import { categorySchema } from "../../validators/categoryValidation.js"
import { AppError } from "../../utils/AppError.js";
import { STATUS } from "../../utils/statusCodes.js";


export const loadCategory = async (req, res) => {
  const { page = 1, search = "" } = req.query;

  const result = await getCategories({
    page,
    limit: 5,
    search
  });
  const totalCategories = await Category.countDocuments()
  const activeCategories = await Category.countDocuments({isActive:true})
  const inactiveCategories = await Category.countDocuments({isActive:false})
  const deletedCategories = await Category.countDocuments({isDeleted:true})

  res.render("admin/category", {
    activeNavLink: "Category",
    categories: result.categories,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    search,
    totalCategories,
    activeCategories,
    inactiveCategories,
    deletedCategories
  });
}
export const loadAddCategory = async (req, res) => {

 
  res.render("admin/addCategory", {
    
    activeNavLink: "Category"
  })
}

export const addCategory = async (req, res) => {

    try {

        const { error } =
            categorySchema.validate(req.body);

        if (error) {

            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        let image = {};

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Category image is required"
            });
        }

        image = {
            url: req.file.path,
            public_id: req.file.filename
        };

        const data = {
            ...req.body,
            image
        };

        await createCategory(data);

        return res.status(201).json({
            success: true,
            message: "Category added successfully"
        });

    } catch (error) {

        console.log(error);

        return res.status(error.statusCode || 500)
            .json({success: false,
                  message: error.message || "Something went wrong"
        });
    }
}

export const blockCategory = async (req, res) => {
  try {

    await Category.findByIdAndUpdate(req.params.id,{
      isActive:false
    })

    res.json({success:true})

  } catch (error) {

    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}


export const unblockCategory = async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id,{
    isActive:true},{returnDocument:"after"})
  res.json({success:true})
}

export const deleteCategory = async (req, res) => {

    try {

        await Category.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: true,
                isActive:false
            }
        );

        res.json({
            success: true
        });

    } catch (error) {

        res.status(500).json({
            success: false
        });
    }
}

export const restoreCategory = async (req, res) => {
  try {
    console.log({id:req.params.id})
    await Category.findOneAndUpdate(
      {_id:req.params.id},{
        isDeleted:false
      }
    )
    
    res.json({success:true})
  } catch (error) {
      console.log(error);

       res.status(500).json({
            success: false
        });
  }
}

export const categoryRefreshStat = async(req,res) => {

    const totalCategories =
        await Category.countDocuments({});

    const activeCategories =
        await Category.countDocuments({
            isDeleted:false,
            isActive:true
        });

    const inactiveCategories =
        await Category.countDocuments({
            isDeleted:false,
            isActive:false
        });
    const deletedCategories = 
        await Category.countDocuments({
            isDeleted:true,
            
        })
    res.json({
        deletedCategories,
        totalCategories,
        activeCategories,
        inactiveCategories
    });
}


export const searchCategory = async (req,res) => {

  const search = req.query.search ||""
  const filter = req.query.filter || "All"

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const query = {}

  if(search){
    query.name = {
      $regex: search, $options: "i"
    }
    
  }
  if(filter === "Active"){

    query.isActive = true;

    query.isDeleted = false;
}

else if(filter === "Inactive"){

    query.isActive = false;

    query.isDeleted = false;
}

else if(filter === "Deleted"){

    query.isDeleted = true;
}

else{

    query.isDeleted = false;
}

  const categories = await Category.find(query)
                    .sort({createdAt:-1})
                    .skip(skip)
                    .limit(limit)
  const totalCategories = await Category.countDocuments(query)
  const totalPages = Math.ceil(totalCategories / limit)

  res.json({
  success:true,
  categories,
  totalPages,
  currentPage:page,
  totalResults:totalCategories
})

}

export const loadEditCategory = async (req, res) => {

    const category = await Category.findById(req.params.id);

    

    res.render("admin/editCategory", {
        category,
        
        activeNavLink: "Category"
    });
}

export const editCategory = async (req,res) =>{
  try {
    const category = await Category.findById(req.params.id)

  if(!category){
    return res.status(400).json({
      success:false,
      message:" Category not found"
    })
  }

  const {error} = await categorySchema.validate(req.body)

  if(error) {
    return res.status(400).json({
      success:false,
      message:error.details[0].message
    })
  }

  let image = category.image

  if(req.file){
    image = {
      url:req.file.path,
      public_id: req.file.filename
    }
  }
  const data = {...req.body,image}

  await updateCategory(req.params.id,data)
 
   
  return res.status(200).json({
    success:true,
    message:"Category updated successfully"
})
  } catch (error) {
    
         console.log(error);

        return res.status(error.statusCode || 500)
            .json({success: false,
                  message: error.message || "Something went wrong"
        });
  }
  

}
