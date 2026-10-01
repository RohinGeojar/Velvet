import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

export const createUploader = (folderName, fileSize = 2) => {

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `velvet/${folderName}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"]
    }
  });

  return multer({
    storage,
    limits: {
      fileSize: fileSize * 1024 * 1024
    },
     fileFilter: (req, file, cb) => {
   

        const allowedTypes = [
            "image/jpeg",
            "image/png",
             "image/jpg",
            "image/webp",
            "image/avif"
        ]
        console.log(file.mimetype)

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error("Only JPG, PNG,AVIF and WEBP  images are allowed"), false)
        }
    }
  })
}