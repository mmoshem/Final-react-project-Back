import Group from '../models/Group.js';

// ENHANCED SEARCH with filters
export const searchGroups = async (req, res) => {
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
}; 