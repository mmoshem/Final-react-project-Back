import express from 'express';
import uploadController from '../controllers/uploadController.js';

const router = express.Router();


router.post('/api/upload', uploadController.uploadMiddleware, uploadController.uploadController);

export default router;
