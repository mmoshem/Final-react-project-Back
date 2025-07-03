import express from 'express';
import { createPost, getAllPosts, deletePost } from '../controllers/CreatePost.js';

const router = express.Router();

router.post('/api/posts', createPost);
router.get('/api/posts', getAllPosts);
router.delete('/api/posts/:id', deletePost);

export default router;
