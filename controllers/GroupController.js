import Group from '../models/Group.js';
import UserInfo from '../models/UserInfo.js';
import mongoose from 'mongoose'; // ✅ Added this import
import cloudinary from '../config/cloudinary.js'; // Add this import for Cloudinary cleanup
import Post from '../models/PostModel.js';

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

        // Add groupId to creator's followingGroups if not already present
        if (userId) {
            const userInfo = await UserInfo.findOne({ userId });
            if (userInfo && !userInfo.followingGroups.includes(newGroup._id)) {
                userInfo.followingGroups.push(newGroup._id);
                await userInfo.save();
            }
        }

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
        console.log('🚨 Group ID received:', groupId);

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

        // Remove groupId from followingGroups for all members and creator
        const memberIds = group.members.map(id => id.toString());
        if (group.creator && !memberIds.includes(group.creator.toString())) {
            memberIds.push(group.creator.toString());
        }
        await UserInfo.updateMany(
            { userId: { $in: memberIds }, followingGroups: group._id },
            { $pull: { followingGroups: group._id } }
        );

        // 1. Delete all Cloudinary images for posts in this group (mediaUrls array)
        const posts = await Post.find({ groupId });
        for (const post of posts) {
            if (Array.isArray(post.mediaUrls)) {
                for (const mediaUrl of post.mediaUrls) {
                    if (typeof mediaUrl === 'string' && mediaUrl.includes('cloudinary.com')) {
                        let publicId;
                        const urlParts = mediaUrl.split('/');
                        const uploadIndex = urlParts.findIndex(part => part === 'upload');
                        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                            const startIndex = urlParts[uploadIndex + 1].startsWith('v') ? uploadIndex + 2 : uploadIndex + 1;
                            const pathParts = urlParts.slice(startIndex);
                            const lastPart = pathParts[pathParts.length - 1];
                            pathParts[pathParts.length - 1] = lastPart.split('.')[0];
                            publicId = pathParts.join('/');
                        }
                        if (publicId) {
                            try {
                                await cloudinary.uploader.destroy(publicId);
                            } catch (err) {
                                console.error('Error deleting post media from Cloudinary:', err);
                            }
                        }
                    }
                }
            }
        }

        // 2. Delete all posts belonging to this group
        await Post.deleteMany({ groupId });

        // 3. Delete the group photo (already handled below)
        if (group.image) {
            const imageUrl = group.image;
            let publicId;
            if (imageUrl.includes('cloudinary.com')) {
                const urlParts = imageUrl.split('/');
                const uploadIndex = urlParts.findIndex(part => part === 'upload');
                if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                    const startIndex = urlParts[uploadIndex + 1].startsWith('v') ? uploadIndex + 2 : uploadIndex + 1;
                    const pathParts = urlParts.slice(startIndex);
                    const lastPart = pathParts[pathParts.length - 1];
                    pathParts[pathParts.length - 1] = lastPart.split('.')[0];
                    publicId = pathParts.join('/');
                }
            }
            try {
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
                const expectedPublicId = `group_pictures/group_${groupId}`;
                await cloudinary.uploader.destroy(expectedPublicId);
            } catch (cloudinaryError) {
                console.error('Cloudinary deletion error:', cloudinaryError);
            }
        }

        // 4. Delete the group from database
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