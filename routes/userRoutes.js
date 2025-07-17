import express from 'express';
const router = express.Router(); 
import userController from '../controllers/userController.js';
import { searchUsers } from '../controllers/userInfoController.js';
const { handleUserCommand, getUserInfo, getFriendsInfo} = userController;

router.post('/api/users', handleUserCommand);
router.get('/api/userinfo/:userId', getUserInfo);
router.get('/api/users/search', searchUsers);
router.post('/api/getFriendsInfo', getFriendsInfo);

export default router;