// const express = require('express');
import express from 'express';
const router = express.Router(); 
// const { handleUserCommand } = require('../controllers/userController');
// import { handleUserCommand } from '../controllers/userController.js';
import userController from '../controllers/userController.js';
import { searchUsers } from '../controllers/userInfoController.js';

const { handleUserCommand, getUserInfo } = userController;
router.post('/api/users', handleUserCommand);
router.get('/api/userinfo/:userId', getUserInfo);
router.get('/api/users/search', searchUsers);
// module.exports = router;
export default router;