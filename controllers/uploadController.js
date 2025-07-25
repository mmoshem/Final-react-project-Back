import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for Cloudinary upload
  limits: { fileSize: 90 * 1024 * 1024 }
});


const uploadController = async (req, res) => {
    try { 

        if (!req.file) {
            return res.status(400).json({ message: 'No image provided' });
        } 
        console.log('File received:', req.file.originalname);

        // Upload the image to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream =  cloudinary.uploader.upload_stream(
                {resource_type: 'auto', folder: 'social_posts'}, 
                (error,result ) => {
                    if (error){
                         console.error('Cloudinary error:', error);
                        reject(error);
                    }
                    else{
                        resolve(result);
                    }
                }
            );
            uploadStream.end(req.file.buffer); 
        });

        return res.status(200).json({
            success: true,
            url: result.secure_url
        });
       
    }catch (error) {
       console.error('Error in uploadController:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Upload failed' 
        });
    }
}

const uploadMiddleware = upload.single('file'); 
export default{ uploadController, uploadMiddleware };