import express from 'express';
import Group from '../../models/Group.js';
import Post from '../../models/PostModel.js';
import mongoose from 'mongoose';
import UserInfo from '../../models/UserInfo.js';

const router = express.Router();

// GET all posts for a specific group
router.get('/api/groups/:groupId/posts', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        
        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Get posts with simple populate
        const posts = await Post.find({ groupId })
            .populate('userId')
            .sort({ createdAt: -1 });
        
        // Manually fetch userInfo for each post
        const postsWithUserInfo = await Promise.all(posts.map(async (post) => {
            if (!post.userId) {
                return {
                    _id: post._id,
                    content: post.content,
                    imageUrl: post.imageUrl,
                    createdAt: post.createdAt,
                    likes: post.likes,
                    comments: post.comments,
                    userId: {
                        _id: null,
                        email: '',
                        name: 'Unknown User',
                        profilePicture: ''
                    }
                };
            }
            const userInfo = await UserInfo.findOne({ userId: post.userId._id });
            
            return {
                _id: post._id,
                content: post.content,
                imageUrl: post.imageUrl,
                createdAt: post.createdAt,
                likes: post.likes,
                comments: post.comments,
                userId: {
                    _id: post.userId._id,
                    email: post.userId.email,
                    name: userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : post.userId.email,
                    profilePicture: userInfo?.profilePicture || ''
                }
            };
        }));
        
        console.log('Group posts with user info:', postsWithUserInfo);
        res.json(postsWithUserInfo);
    } catch (error) {
        console.error('Error fetching group posts:', error);
        res.status(500).json({ message: error.message });
    }
});
// POST create new post in group
router.post('/api/groups/:groupId/posts', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { userId, content, imageUrl } = req.body; // ADD imageUrl here
        
        console.log('Creating post with:', { userId, content, imageUrl, groupId }); // ADD this for debugging
        
        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Create new post
        const newPost = new Post({
            userId,
            content,
            groupId,
            imageUrl: imageUrl || null // USE the imageUrl from request
        });
        
        await newPost.save();
        
        // Return populated post
        const populatedPost = await Post.findById(newPost._id)
            .populate('userId', 'name');
        
        res.status(201).json(populatedPost);
    } catch (error) {
        console.error('Error creating group post:', error);
        res.status(500).json({ message: error.message });
    }
});

// DELETE post from group
router.delete('/api/groups/:groupId/posts/:postId', async (req, res) => {
    try {
        const { groupId, postId } = req.params;
        const { userId } = req.body;
        
        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Find the post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        // Check if user is the post author or group admin
        const isAuthor = post.userId.equals(userId);
        const isAdmin = group.creator && group.creator.equals(userId);
        
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ message: 'You can only delete your own posts or if you are the group admin' });
        }
        
        await Post.findByIdAndDelete(postId);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;