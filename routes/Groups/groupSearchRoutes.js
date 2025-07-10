import express from 'express';
import Group from '../../models/Group.js';

const router = express.Router();

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
                sortOptions = { memberCount: -1 };
                break;
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            case 'oldest':
                sortOptions = { createdAt: 1 };
                break;
            case 'name':
                sortOptions = { name: 1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
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

export default router;