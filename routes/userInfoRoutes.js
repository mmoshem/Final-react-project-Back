import express from 'express';
import { updateUserInfo } from '../controllers/userInfoController.js';

const router = express.Router();
router.put('/api/userinfo/:userId', updateUserInfo);
router.post('/api/userinfo/update', updateUserInfo);
export default router;
