// const express = require('express');
import express from 'express';
const router = express.Router(); 
// const { handleUserCommand } = require('../controllers/userController');
// import { handleUserCommand } from '../controllers/userController.js';
import userController from '../controllers/userController.js';
const { handleUserCommand } = userController;
router.post('/api/users', handleUserCommand);

// module.exports = router;
export default router;