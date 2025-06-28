import express from 'express';
import uploadController from '../controllers/uploadController.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Upload route working!' });
});

router.post('/api/upload', uploadController.uploadMiddleware, uploadController.uploadController);

export default router;
