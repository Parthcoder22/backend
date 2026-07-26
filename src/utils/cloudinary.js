import { v2 as cloudinary } from "cloudinary";
import { resolve } from "dns";
import fs from "fs"

cloudinary.config(
    {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    }
)

const uploadOnCloudinary = async (localfilepath) => {

    try {

        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto"
        }
        )

        console.log("file uploaded on cludinary successsfully !!!", response.url);

        return response

    } catch (error) {

        fs.unlink(localfilepath)

        return null

    }
}


export { uploadOnCloudinary }