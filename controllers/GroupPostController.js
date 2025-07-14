import Group from '../models/Group.js';
import Post from '../models/PostModel.js';
import UserInfo from '../models/UserInfo.js';

// GET all posts for a specific group
export const getGroupPosts = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        
        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Get posts for this group
        const posts = await Post.find({ groupId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        
        // ✅ ENRICH POSTS WITH USERINFO (same pattern as members)
        const userIds = posts.map(post => post.userId._id.toString());
        const userInfos = await UserInfo.find({ userId: { $in: userIds } });
        
        // Create map of userId to UserInfo
        const userInfoMap = {};
        userInfos.forEach(info => {
            userInfoMap[info.userId.toString()] = info;
        });
        
        // Enrich posts with proper user names
        const enrichedPosts = posts.map(post => {
            const info = userInfoMap[post.userId._id.toString()];
            const firstName = info?.first_name || '';
            const lastName = info?.last_name || '';
            const displayName = (firstName || lastName) 
                ? `${firstName} ${lastName}`.trim() 
                : post.userId.name || post.userId.email || 'Unknown User';
            
            return {
                ...post.toObject(),
                userId: {
                    ...post.userId.toObject(),
                    displayName,
                    first_name: firstName,
                    last_name: lastName,
                    profilePicture: info?.profilePicture || ''
                }
            };
        });
        
        res.json(enrichedPosts);
    } catch (error) {
        console.error('Error fetching group posts:', error);
        res.status(500).json({ message: error.message });
    }
};

// POST create new post in group
export const createGroupPost = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { userId, content, imageUrl } = req.body;
        
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
            mediaUrls: imageUrl ? [imageUrl] : []
        });
        
        await newPost.save();
        
        // Return populated post with UserInfo enrichment
        const populatedPost = await Post.findById(newPost._id)
            .populate('userId', 'name email');
        
        // ✅ ENRICH THE NEW POST TOO
        const userInfo = await UserInfo.findOne({ userId: populatedPost.userId._id });
        const firstName = userInfo?.first_name || '';
        const lastName = userInfo?.last_name || '';
        const displayName = (firstName || lastName) 
            ? `${firstName} ${lastName}`.trim() 
            : populatedPost.userId.name || populatedPost.userId.email || 'Unknown User';
        
        const enrichedPost = {
            ...populatedPost.toObject(),
            userId: {
                ...populatedPost.userId.toObject(),
                displayName,
                first_name: firstName,
                last_name: lastName,
                profilePicture: userInfo?.profilePicture || ''
            }
        };
        
        res.status(201).json(enrichedPost);
    } catch (error) {
        console.error('Error creating group post:', error);
        res.status(500).json({ message: error.message });
    }
};

// DELETE post from group
export const deleteGroupPost = async (req, res) => {
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
};