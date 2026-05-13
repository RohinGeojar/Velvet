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
    }
  });
};