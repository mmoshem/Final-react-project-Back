
import express from 'express';
import { handleUniversalLogin } from '../controllers/authController.js';

const router = express.Router();
router.post('/api/auth/login', handleUniversalLogin);

export default router;
