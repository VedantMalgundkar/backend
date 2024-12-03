import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudnary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"})
        fs.unlinkSync(localFilePath)
        return response

    }catch(error){
        fs.unlinkSync(localFilePath)
        return null
    }

}

const updatetoCloudnary = async (newLocalFile,oldPublicId)=>{
    
    if(!newLocalFile) return null
    const newResponse = await uploadToCloudnary(newLocalFile)
    
    let delResponse;
    try {
        delResponse = await cloudinary.uploader.destroy(oldPublicId);
    } catch (error) {
        console.error("Error deleting image:", error.message);
        delResponse = { error: error.message };
    }

    return { newResponse , delResponse}

}

export { uploadToCloudnary , updatetoCloudnary} 