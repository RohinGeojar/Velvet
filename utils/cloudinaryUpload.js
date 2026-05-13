import cloudinary from "../config/cloudinary.js"

export const uploadToCloudinary = (fileBuffer, folderName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `velvet/${folderName}`,
                resource_type: "image",
                transformation: [
                    { quality: "auto", fetch_format: "auto" }
                ]
            },
            (error, result) => {
                if (error) return reject(error)
                resolve(result)
            }
        )
        stream.end(fileBuffer)
    })
}