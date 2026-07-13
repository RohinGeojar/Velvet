import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/productModel.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const products = await Product.find();

for (const product of products) {

    const newVariants = product.variants.map(variant => ({

        _id: new mongoose.Types.ObjectId(),

        color: variant.color,
        colorCode: variant.colorCode,
        regularPrice: variant.regularPrice,
        salePrice: variant.salePrice,
        images: variant.images,
        sizes: variant.sizes

    }));

    await Product.updateOne(

        { _id: product._id },

        {
            $set: {
                variants: newVariants
            }
        }

    );

    console.log(`Migrated ${product.productName}`);

}

console.log("Migration completed.");

await mongoose.disconnect();