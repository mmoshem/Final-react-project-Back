import Group from '../models/Group.js';
import UserInfo from '../models/UserInfo.js';
import mongoose from 'mongoose'; // ✅ Added this import
import cloudinary from '../config/cloudinary.js'; // Add this import for Cloudinary cleanup

console.log('🚨🚨🚨 GROUP CONTROLLER LOADED WITH DEBUG VERSION! 🚨🚨🚨'); // ADD THIS LINE


// GET all groups
export const getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find().populate('creator', 'name');
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET single group by ID
export const getGroupById = async (req, res) => {
    try {
        // ✅ Validate ObjectId BEFORE querying database
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        const group = await Group.findById(req.params.id)
            .populate('creator', 'name')
            .populate('members', 'name')
            .populate('pendingRequests.userId', 'email');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Get all userIds from pendingRequests
        const userIds = group.pendingRequests
            .map(req => req.userId?._id?.toString() || req.userId?.toString())
            .filter(Boolean);

        // Fetch UserInfo for all userIds
        const userInfos = await UserInfo.find({ userId: { $in: userIds } });

        // Map userId to UserInfo
        const userInfoMap = {};
        userInfos.forEach(info => {
            userInfoMap[info.userId.toString()] = info;
        });

        // Build a new array for pendingRequests with UserInfo fields and displayName
        const enrichedPendingRequests = group.pendingRequests.map(req => {
            const id = req.userId?._id?.toString() || req.userId?.toString();
            const info = userInfoMap[id];
            const firstName = info?.first_name || '';
            const lastName = info?.last_name || '';
            const displayName = (firstName || lastName)
                ? `${firstName} ${lastName}`.trim()
                : req.userId?.email || 'Unknown User';
            return {
                ...req.toObject(),
                userId: {
                    ...(req.userId?.toObject ? req.userId.toObject() : req.userId),
                    first_name: firstName,
                    last_name: lastName,
                    profilePicture: info?.profilePicture || '',
                    displayName
                }
            };
        });

        // Send a plain JS object with enriched pendingRequests
        res.json({
            ...group.toObject(),
            pendingRequests: enrichedPendingRequests
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST create new group
export const createGroup = async (req, res) => {
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
};

// PUT update group
export const updateGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        
        // ✅ Validate ObjectId BEFORE querying database
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        const { name, description, image, isPrivate, userId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is the creator
        if (userId && group.creator && !group.creator.equals(userId)) {
            return res.status(403).json({ message: 'Only the group creator can update this group' });
        }

        // Check if new name already exists
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

        const updatedGroup = await Group.findById(groupId)
            .populate('creator', 'name')
            .populate('members', 'name');

        res.json(updatedGroup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Replace your deleteGroup function with this debug version temporarily
export const deleteGroup = async (req, res) => {
     console.log('🚨🚨🚨 DELETE GROUP FUNCTION ACTUALLY CALLED! 🚨🚨🚨');
    console.log('🚨🚨🚨 THIS IS THE DEBUG VERSION! 🚨🚨🚨');
    
    
    try {
        const groupId = req.params.id;
        console.log('🚨 Group ID received:', groupId); // ADD THIS TOO

        
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        const { userId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is the creator
        if (userId && group.creator && !group.creator.equals(userId)) {
            return res.status(403).json({ message: 'Only the group creator can delete this group' });
        }

        // DEBUG: Log the group image URL and what we're trying to delete
        console.log('=== DELETE GROUP DEBUG ===');
        console.log('Group ID:', groupId);
        console.log('Group image URL:', group.image);
        
        if (group.image) {
            // Try to extract public_id from the URL
            const imageUrl = group.image;
            console.log('Full image URL:', imageUrl);
            
            // Cloudinary URLs typically look like:
            // https://res.cloudinary.com/your_cloud/image/upload/v1234567/folder/filename.jpg
            // The public_id is: folder/filename (without extension)
            
            let publicId;
            if (imageUrl.includes('cloudinary.com')) {
                const urlParts = imageUrl.split('/');
                const uploadIndex = urlParts.findIndex(part => part === 'upload');
                if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                    // Skip version number if present (starts with 'v')
                    const startIndex = urlParts[uploadIndex + 1].startsWith('v') ? uploadIndex + 2 : uploadIndex + 1;
                    const pathParts = urlParts.slice(startIndex);
                    // Remove file extension from last part
                    const lastPart = pathParts[pathParts.length - 1];
                    pathParts[pathParts.length - 1] = lastPart.split('.')[0];
                    publicId = pathParts.join('/');
                }
            }
            
            console.log('Extracted public_id:', publicId);
            console.log('Fallback public_id:', `group_pictures/group_${groupId}`);
            
            try {
                // Try the extracted public_id first
                if (publicId) {
                    console.log(`Attempting to delete with extracted public_id: ${publicId}`);
                    const result1 = await cloudinary.uploader.destroy(publicId);
                    console.log('Delete result with extracted public_id:', result1);
                }
                
                // Also try the expected format
                const expectedPublicId = `group_pictures/group_${groupId}`;
                console.log(`Attempting to delete with expected public_id: ${expectedPublicId}`);
                const result2 = await cloudinary.uploader.destroy(expectedPublicId);
                console.log('Delete result with expected public_id:', result2);
                
            } catch (cloudinaryError) {
                console.error('Cloudinary deletion error:', cloudinaryError);
            }
        }

        // Delete the group from database
        await Group.findByIdAndDelete(groupId);
        
        console.log('=== END DELETE GROUP DEBUG ===');
        res.json({ message: 'Group deleted - check console for debug info' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: error.message });
    }
};

// GET groups by creator
export const getGroupsByCreator = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // ✅ Validate ObjectId BEFORE querying database
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const groups = await Group.find({ creator: userId })
            .populate('creator', 'name')
            .sort({ createdAt: -1 });

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET groups where user is a member
export const getGroupsByMember = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // ✅ Validate ObjectId BEFORE querying database
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const groups = await Group.find({ members: userId })
            .populate('creator', 'name')
            .sort({ createdAt: -1 });

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};