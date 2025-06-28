import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

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
        res.json({
            message: 'Image resived successfully'
         });
    }catch (error) {
        console.error('Error receiving image :', error);
        res.status(500).json({ message: 'Receiving image faild' });
    }
}

const uploadMiddleware = upload.single('image'); 
export default{ uploadController, uploadMiddleware };