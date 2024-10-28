import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",
//     });

//     console.log(
//       `File Uploaded Sucessfully On Cloudinary.\nURL: ${response.url}`
//     );

//     fs.unlinkSync(localFilePath);

//     return response;
//   } catch (error) {
//     fs.unlinkSync(localFilePath);
//     return null;
//   }
// };

// export { uploadOnCloudinary };

const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log(`Attempting to upload file: ${localFilePath}`);
    if (!localFilePath) {
      console.log("No local file path provided");
      return null;
    }
    if (!fs.existsSync(localFilePath)) {
      console.log(`File does not exist at path: ${localFilePath}`);
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(`File uploaded successfully. URL: ${response.url}`);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error(`Error uploading to Cloudinary: ${error.message}`);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};
export { uploadOnCloudinary };
