import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/velvetvogue")
        console.log("MongoDB Connected")
    }catch(err){
        console.error("DB Error:", err)
        process.exit(1)
    }
}