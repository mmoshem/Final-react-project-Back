import express from 'express';
import { updateUserInfo } from '../controllers/userInfoController.js';
import { followUser, unfollowUser } from '../controllers/userInfoController.js';
import {getFollowers,getFollowing} from '../controllers/userInfoController.js';

const router = express.Router();
router.put('/:userId', updateUserInfo);
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);


//router.post('/api/userinfo/update', updateUserInfo);

export default router;


