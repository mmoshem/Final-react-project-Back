import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for Cloudinary upload
  limits: { fileSize: 5 * 1024 * 1024 }
});


const uploadController = async (req, res) => {
    try {
        console.log('Upload request received:'); 

        if (!req.file) {
            return res.status(400).json({ message: 'No image provided' });
        } 
        console.log('File received:', req.file.originalname);

        // Upload the image to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream =  cloudinary.uploader.upload_stream(
                {resource_type: 'image', folder: 'social_posts'}, // Specify folder in Cloudinary
                (error,result ) => {
                    if (error) reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(req.file.buffer); 
        });
        console.log('Image uploaded to Cloudinary');
        res.json({
            success: true,
            url: result.secure_url
         });
    }catch (error) {
        console.error('Error receiving image :', error);
        res.status(500).json({ message: 'uploading faild' });
    }
}

const uploadMiddleware = upload.single('image'); 
export default{ uploadController, uploadMiddleware };