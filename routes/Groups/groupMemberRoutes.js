import express from 'express';
import Group from '../../models/Group.js';
import UserInfo from '../../models/UserInfo.js';
const router = express.Router();

// POST join group (public groups)
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
            await UserInfo.findOneAndUpdate(
                { userId: userId },
                { $addToSet: { followingGroups: groupId } } // $addToSet prevents duplicates

            );
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
             await UserInfo.findOneAndUpdate(
             { userId: userId },
             { $pull: { followingGroups: groupId } }
            );
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
        
        console.log('Cancel request - groupId:', groupId, 'userId:', userId);
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        console.log('Before cancel - pendingRequests:', group.pendingRequests);
        
        // Remove from pending requests - MORE ROBUST FILTERING
        if (group.pendingRequests) {
            group.pendingRequests = group.pendingRequests.filter(req => {
                const reqUserId = req.userId.toString();
                return reqUserId !== userId;
            });
        }
        
        await group.save();
        
        console.log('After cancel - pendingRequests:', group.pendingRequests);
        
        res.json({ message: 'Join request canceled successfully' });
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;