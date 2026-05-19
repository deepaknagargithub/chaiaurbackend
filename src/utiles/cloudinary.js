// import { v2 as cloudinary } from 'cloudinary'
// import fs from "fs"


// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });


// const uploadOnCloudinary = async (localFilePath) =>{
//     try {
//         if(!localFilePath) return null
//         // upload the file on cloudinary
//        const response = await cloudinary.uploader.upload(localFilePath,{
//             resource_type: "auto"
//        });
//        console.log("File uploaded successfully on cloudinary:",response.url)
//        return response;
//     } catch (error) {
//         fs.unlinkSync(localFilePath) // remove the locally stored temp file as the upload failed
//         return null;
//     }   
// }

// export {uploadOnCloudinary}





















import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
import fs from "fs";

import dotenv from "dotenv"
dotenv.config({path:"./.env"})  

cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("CLOUD NAME →", process.env.CLOUDINARY_CLOUD_NAME);
console.log(process.env.CLOUDINARY_API_KEY);
console.log(process.env.CLOUDINARY_API_SECRET);



const uploadOnCloudinary = async (localFilePath) => {

   try {

      if (!localFilePath) return null;

      // Upload file to cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
         resource_type: "auto"
      });

      console.log("File uploaded successfully:", response.url);

      // Remove local file after successful upload
      fs.unlinkSync(localFilePath);

      return response;

   } catch (error) {

      console.log("Cloudinary upload error:", error);

      // Remove temp file if upload fails
      if (fs.existsSync(localFilePath)) {
         fs.unlinkSync(localFilePath);
      }

      return null;
   }
};

export { uploadOnCloudinary };