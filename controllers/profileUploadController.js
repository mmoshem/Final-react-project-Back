import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import UserInfo from '../models/UserInfo.js'; 
import Group from '../models/Group.js'; 

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.body.userId;
    const groupId = req.body.groupId; 

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    if (!userId && !groupId) { // group
      return res.status(400).json({ success: false, message: 'Missing userId or groupId' });
    }

    const isGroupUpload = !!groupId; 
    const uploadTarget = isGroupUpload ? groupId : userId; 

    console.log(`Uploading ${isGroupUpload ? 'group' : 'profile'} picture for ${isGroupUpload ? 'group' : 'user'} ${uploadTarget}...`); // group

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: isGroupUpload ? 'group_pictures' : 'profile_pictures', 
          public_id: isGroupUpload ? `group_${groupId}` : userId, 
          overwrite: true,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary error:', error);
            return reject(error);
          }
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    // group - conditional database update
    if (isGroupUpload) {
      // group - update group image
      await Group.findByIdAndUpdate(
        groupId,
        { image: result.secure_url },
        { new: true }
      );
    } else {
      await UserInfo.findOneAndUpdate(
        { userId }, // מחפש לפי userId
        { profilePicture: result.secure_url }, // מעדכן כתובת תמונה
        { new: true } 
      );
    }

    return res.status(200).json({
      success: true,
      url: result.secure_url
    });

  } catch (error) {
    console.error('Error uploading picture:', error); 
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