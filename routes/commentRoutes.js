import express from 'express';
import { createComment, getCommentsForPost, likeComment, getCommentLikers, editComment, deleteComment } from '../controllers/commentController.js';

const router = express.Router();

router.post('/api/comments', createComment);
router.get('/api/comments', getCommentsForPost);
router.post('/api/comments/:commentId/like', likeComment);
router.get('/api/comments/:commentId/likers', getCommentLikers);
router.put('/api/comments/:commentId', editComment);
router.delete('/api/comments/:commentId', deleteComment);

export default router; 