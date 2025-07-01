import express from 'express';
import Group from '../models/Group.js';

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
        const { name, description, image, isPrivate } = req.body;
        
        const newGroup = new Group({
            name,
            description,
            image,
            isPrivate,
            creator: null,
            members: []
        });
        
        console.log('About to save group:', newGroup);
        await newGroup.save();
        console.log('Group saved successfully!');
        res.status(201).json(newGroup);
    } catch (error) {
        console.log('Error saving group:', error.message);
        res.status(400).json({ message: error.message });
    }
});

export default router;