import express from 'express';
import profileUploadController from '../controllers/profileUploadController.js';

const router = express.Router();

router.post(
  '/upload-profile-picture',
  profileUploadController.profileUploadMiddleware,
  profileUploadController.uploadProfilePicture
);
console.log("Upload route hit");

export default router;
