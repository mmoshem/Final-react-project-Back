import express from 'express';
import Group from '../../models/Group.js';

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

// POST create new group
router.post('/api/groups', async (req, res) => {
    console.log('POST /api/groups received:', req.body);
    
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
        
        await newGroup.save();
        
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