import { v2 as cloudinary, ConfigOptions } from "cloudinary";

// Конфіг з твого .env (CLOUDINARY_URL або ключі)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
} as ConfigOptions);

export default cloudinary;
