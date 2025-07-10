import express from 'express';
import Group from '../models/Group.js';
import Post from '../models/Post.js';

const router = express.Router();

// GET all groups
router.get('/api/groups', async (req, res) => {
    try {
        const groups = await Group.find().populate('creator', 'name');
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET all posts for a specific group
router.get('/api/groups/:groupId/posts', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        
        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Get posts for this group
        const posts = await Post.find({ groupId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        
        res.json(posts);
    } catch (error) {
        console.error('Error fetching group posts:', error);
        res.status(500).json({ message: error.message });
    }
});

// POST create new post in group
router.post('/api/groups/:groupId/posts', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { userId, content } = req.body;
        
        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Create new post
        const newPost = new Post({
            userId,
            content,
            groupId, // Add groupId to associate with group
            imageUrl: null // No images for now
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

// POST request to join private group
router.post('/api/groups/:id/request', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { userId } = req.body;
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Check if user already has pending request
        const existingRequest = group.pendingRequests && group.pendingRequests.find(req => req.userId === userId);
        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending request for this group' });
        }
        
        // Add to pending requests
        if (!group.pendingRequests) group.pendingRequests = [];
        group.pendingRequests.push({
            userId,
            requestedAt: new Date()
        });
        
        await group.save();
        
        res.json({ message: 'Join request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST cancel join request
router.post('/api/groups/:id/cancel-request', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { userId } = req.body;
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Remove from pending requests
        if (group.pendingRequests) {
            group.pendingRequests = group.pendingRequests.filter(req => req.userId !== userId);
        }
        
        await group.save();
        
        res.json({ message: 'Join request canceled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ENHANCED SEARCH with filters
router.get('/api/groups/search', async (req, res) => {
    try {
        const { q, isPrivate, minMembers, maxMembers, sortBy } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        console.log('Searching for:', q);
        
        let searchQuery = {};
        
        // Text search in name and description
        searchQuery.$or = [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
        ];
        
        // Privacy filter
        if (isPrivate !== undefined) {
            searchQuery.isPrivate = isPrivate === 'true';
        }
        
        // Member count filters
        if (minMembers || maxMembers) {
            searchQuery.memberCount = {};
            if (minMembers) {
                searchQuery.memberCount.$gte = parseInt(minMembers);
            }
            if (maxMembers) {
                searchQuery.memberCount.$lte = parseInt(maxMembers);
            }
        }
        
        // Build sort options
        let sortOptions = {};
        switch (sortBy) {
            case 'members':
                sortOptions = { memberCount: -1 }; // Most members first
                break;
            case 'newest':
                sortOptions = { createdAt: -1 }; // Newest first
                break;
            case 'oldest':
                sortOptions = { createdAt: 1 }; // Oldest first
                break;
            case 'name':
                sortOptions = { name: 1 }; // Alphabetical
                break;
            default:
                sortOptions = { createdAt: -1 }; // Default to newest
        }
        
        const groups = await Group.find(searchQuery)
            .populate('creator', 'name')
            .sort(sortOptions)
            .limit(50);
        
        console.log('Found groups:', groups.length);
        res.json(groups);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET single group by ID
router.get('/api/groups/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('creator', 'name')
            .populate('members', 'name')
            .populate('pendingRequests.userId', 'name');
        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST join group
router.post('/api/groups/:id/join', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { userId } = req.body;
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Check if user is already a member
        if (userId && group.members.includes(userId)) {
            return res.status(400).json({ message: 'You are already a member of this group' });
        }
        
        // Add user to members array
        if (userId) {
            group.members.push(userId);
        }
        
        // Update member count
        group.memberCount = group.members.length;
        await group.save();
        
        // Return updated group
        const updatedGroup = await Group.findById(groupId)
            .populate('creator', 'name')
            .populate('members', 'name');
        
        res.json({ 
            message: 'Successfully joined group', 
            group: updatedGroup 
        });
    } catch (error) {
        console.error('Join group error:', error);
        res.status(500).json({ message: error.message });
    }
});

// POST leave group
router.post('/api/groups/:id/leave', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { userId } = req.body;
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Check if user is a member
        if (userId && !group.members.includes(userId)) {
            return res.status(400).json({ message: 'You are not a member of this group' });
        }
        
        // Remove user from members array
        if (userId) {
            group.members = group.members.filter(memberId => !memberId.equals(userId));
        }
        
        // Update member count
        group.memberCount = group.members.length;
        await group.save();
        
        // Return updated group
        const updatedGroup = await Group.findById(groupId)
            .populate('creator', 'name')
            .populate('members', 'name');
        
        res.json({ 
            message: 'Successfully left group', 
            group: updatedGroup 
        });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ message: error.message });
    }
});

// POST create new group
router.post('/api/groups', async (req, res) => {
    console.log('POST /api/groups received:', req.body);
    console.log('Data types:', {
        name: typeof req.body.name,
        description: typeof req.body.description,
        image: typeof req.body.image,
        isPrivate: typeof req.body.isPrivate
    });
    
    try {
        const { name, description, image, isPrivate, userId } = req.body;
        
        // Check if group name already exists
        const existingGroup = await Group.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (existingGroup) {
            return res.status(400).json({ message: 'A group with this name already exists' });
        }
        
        const newGroup = new Group({
            name,
            description,
            image,
            isPrivate: isPrivate || false,
            creator: userId || null,
            members: userId ? [userId] : [],
            memberCount: userId ? 1 : 0
        });
        
        console.log('About to save group:', newGroup);
        await newGroup.save();
        console.log('Group saved successfully!');
        
        // Return populated group
        const populatedGroup = await Group.findById(newGroup._id)
            .populate('creator', 'name')
            .populate('members', 'name');
        
        res.status(201).json(populatedGroup);
    } catch (error) {
        console.log('Error saving group:', error.message);
        res.status(400).json({ message: error.message });
    }
});

// PUT update group
router.put('/api/groups/:id', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { name, description, image, isPrivate, userId } = req.body;
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Check if user is the creator
        if (userId && group.creator && !group.creator.equals(userId)) {
            return res.status(403).json({ message: 'Only the group creator can update this group' });
        }
        
        // Check if new name already exists (if name is being changed)
        if (name && name !== group.name) {
            const existingGroup = await Group.findOne({ 
                name: { $regex: `^${name}$`, $options: 'i' },
                _id: { $ne: groupId }
            });
            if (existingGroup) {
                return res.status(400).json({ message: 'A group with this name already exists' });
            }
        }
        
        // Update fields
        if (name !== undefined) group.name = name;
        if (description !== undefined) group.description = description;
        if (image !== undefined) group.image = image;
        if (isPrivate !== undefined) group.isPrivate = isPrivate;
        
        await group.save();
        
        // Return updated group
        const updatedGroup = await Group.findById(groupId)
            .populate('creator', 'name')
            .populate('members', 'name');
        
        res.json(updatedGroup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE group
router.delete('/api/groups/:id', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { userId } = req.body;
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        // Check if user is the creator
        if (userId && group.creator && !group.creator.equals(userId)) {
            return res.status(403).json({ message: 'Only the group creator can delete this group' });
        }
        
        await Group.findByIdAndDelete(groupId);
        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET groups by creator
router.get('/api/groups/creator/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const groups = await Group.find({ creator: userId })
            .populate('creator', 'name')
            .sort({ createdAt: -1 });
        
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET groups where user is a member
router.get('/api/groups/member/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const groups = await Group.find({ members: userId })
            .populate('creator', 'name')
            .sort({ createdAt: -1 });
        
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;