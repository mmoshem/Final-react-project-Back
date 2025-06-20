import express from 'express';
import { updateUserInfo } from '../controllers/userInfoController.js';

const router = express.Router();
router.post('/api/userinfo/update', updateUserInfo);
export default router;
