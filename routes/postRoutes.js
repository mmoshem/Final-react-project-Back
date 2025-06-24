import express from 'express';
import { createPost, getAllPosts } from '../controllers/CreatePost.js';

const router = express.Router();

router.post('/api/posts', createPost);
router.get('/api/posts', getAllPosts);

export default router;
