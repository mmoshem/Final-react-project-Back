import express from 'express';
import { getMessagesBetweenUsers, createMessage, getConversations } from '../controllers/messageController.js';

const router = express.Router();

router.get('/conversations/:userId', getConversations);
router.get('/:user1/:user2', getMessagesBetweenUsers);
router.post('/', createMessage);

export default router; 