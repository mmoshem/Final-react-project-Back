import express from 'express';
import { createPost } from '../controllers/CreatePost.js';

const router = express.Router();

router.post('/api/posts', createPost);

export default router;
