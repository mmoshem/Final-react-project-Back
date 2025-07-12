import express from 'express';
import { createPost, getAllPosts, deletePost, likeDislike, updatePost } from '../controllers/CreatePost.js';

const router = express.Router();

router.post('/api/posts', createPost);
router.get('/api/posts', getAllPosts);
router.delete('/api/posts/:id', deletePost);
router.post('/api/posts/like',likeDislike);
router.put('/api/posts/update', updatePost);
export default router;
