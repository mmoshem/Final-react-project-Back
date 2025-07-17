import express from 'express';
import { createPost, getAllPosts, deletePost, likeDislike, updatePost, getPostLikers } from '../controllers/CreatePost.js';

const router = express.Router();

router.post('/api/posts', createPost);
router.get('/api/posts/:groupid/:userid/:fillter', getAllPosts);
router.delete('/api/posts/:id', deletePost);
router.post('/api/posts/like',likeDislike);
router.put('/api/posts/update', updatePost);
router.get('/api/posts/:postId/likers', getPostLikers);
export default router;
