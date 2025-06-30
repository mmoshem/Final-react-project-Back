import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import UserInfo from '../models/UserInfo.js'; // ✅ ודאי שזה הנתיב הנכון

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.body.userId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }

    console.log(`Uploading profile picture for user ${userId}...`);

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile_pictures',
          public_id: userId,
          overwrite: true,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary error:', error);
            return reject(error);
          }
          console.log('Upload successful:', result.secure_url);
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    // ✅ עדכון כתובת התמונה במסד הנתונים
    await UserInfo.findOneAndUpdate(
      { userId }, // מחפש לפי userId
      { profilePicture: result.secure_url }, // מעדכן כתובת תמונה
      { new: true } // מחזיר את המסמך המעודכן (לא חובה)
    );

    return res.status(200).json({
      success: true,
      url: result.secure_url
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed'
    });
  }
};

const profileUploadMiddleware = upload.single('image');

export default {
  uploadProfilePicture,
  profileUploadMiddleware
};
