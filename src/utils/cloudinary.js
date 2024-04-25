import { v2 as cloudinary} from "cloudinary";
import { log } from "console";
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinay=async(localFilePath)=>{
    try{
        console.log(localFilePath);
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfuly
        fs.unlinkSync(localFilePath) //remove the locally saved temperory file as the upload operation got failed
        return response;
    }
    catch(error){
       fs.unlinkSync(localFilePath) //remove the locally saved temperory file as the upload operation got failed
       console.log("file is unable to upload on cloudinary",error);
       return null;

    }
} 

export {uploadOnCloudinay}