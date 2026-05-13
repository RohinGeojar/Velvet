import Category from "../../models/categoryModel.js"
import { AppError } from "../../utils/AppError.js"
import { capitalizeName, normalizeText } from "../../utils/capitalizer.js"
import { MESSAGES } from "../../utils/messages.js"
import { getPagination } from "../../utils/pagination.js"
import { generateSlug } from "../../utils/slugify.js"
import { STATUS } from "../../utils/statusCodes.js"

export const createCategory = async (data) => {
    let { name, description, image,  isActive } = data

    name = capitalizeName(name)
    description = normalizeText(description)

    const baseSlug = generateSlug(name)
    let slug = baseSlug

    let existingSlug = await Category.findOne({ slug })

    let counter = 1

    while (existingSlug) {
        slug = `${baseSlug}-${counter++}`
        existingSlug = await Category.findOne({ slug })

    }

    const existing = await Category.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
        isDeleted: false
    })

    if (existing) {
        throw new AppError(MESSAGES.CATEGORY_EXISTS, STATUS.BAD_REQUEST)
    }

    return await Category.create({
        name,
        slug,
        description,
        image,
       
        isActive
    })
}



export const getCategories = async ({ page = 1, limit = 10, search = "" }) => {
    const { currentPage, perPage, skip } = getPagination(page, limit);

    const query = {
        isDeleted: false
    };

    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    const categories = await Category.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean()

    const total = await Category.countDocuments(query);

    return {
        categories,
        total,
        currentPage,
        totalPages: Math.ceil(total / perPage)
    };
}

export const updateCategory = async (id, data) => {
    try {
        let { name, description } = data
        name = capitalizeName(name)
        description = normalizeText(description)

        const baseSlug = generateSlug(name)
    let slug = baseSlug

    let existingSlug = await Category.findOne({ slug })

    let counter = 1

    while (existingSlug) {
        slug = `${baseSlug}-${counter++}`
        existingSlug = await Category.findOne({ slug })

    }
    const existing = await Category.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
        isDeleted: false,_id: {$ne: id}

    });
    

    if (existing) {
        throw new AppError(MESSAGES.CATEGORY_EXISTS, STATUS.BAD_REQUEST)
    }

       return await Category.findByIdAndUpdate(id, {
           ...data,
            name,
            description,
            slug
            
        },{ returnDocument:"after" })
       
    } catch (error) {
        console.log(error);

       throw error
    }
}