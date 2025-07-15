import express from 'express';
import { getMessagesBetweenUsers, createMessage } from '../controllers/messageController.js';

const router = express.Router();

router.get('/:user1/:user2', getMessagesBetweenUsers);
router.post('/', createMessage);

export default router; 