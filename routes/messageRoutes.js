import express from 'express';
import { getMessagesBetweenUsers, createMessage, getConversations, getUnreadCounts, markAsRead } from '../controllers/messageController.js';

const router = express.Router();

router.get('/conversations/:userId', getConversations);
router.get('/unreadCounts/:userId', getUnreadCounts);
router.post('/markAsRead', markAsRead);
router.get('/:user1/:user2', getMessagesBetweenUsers);
router.post('/', createMessage);

export default router; 