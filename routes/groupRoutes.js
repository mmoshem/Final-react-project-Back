import express from 'express';
import {
    getAllGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupsByCreator,
    getGroupsByMember
} from '../controllers/GroupController.js';
import { searchGroups } from '../controllers/GroupSearchController.js';
import {
    joinGroup,
    leaveGroup,
    requestJoinGroup,
    cancelJoinRequest,
    approveJoinRequest,
    rejectJoinRequest,
    getGroupMembers,    // ✅ New function
    removeMember        // ✅ New function
} from '../controllers/GroupMemberController.js';
import {
    getGroupPosts,
    createGroupPost,
    deleteGroupPost
} from '../controllers/GroupPostController.js';

const router = express.Router();

// IMPORTANT: All specific routes MUST come before parameterized routes (/:id)

// Search route (must be before /:id)
router.get('/search', searchGroups);

// Test route (can be removed if not needed)
router.get('/test', (req, res) => {
    res.json({ message: '✅ Test route working!' });
});

// Creator/member routes (must be before /:id)
router.get('/creator/:userId', getGroupsByCreator);
router.get('/member/:userId', getGroupsByMember);

// Root routes for getting all groups and creating groups
router.get('/', getAllGroups);
router.post('/', createGroup);

// PARAMETERIZED ROUTES - MUST BE LAST
// These routes use :id parameter, so they must come after all specific routes

// ✅ POSTS ROUTES FIRST (more specific - "posts" is a literal string)
router.get('/:groupId/posts', getGroupPosts);
router.post('/:groupId/posts', createGroupPost);
router.delete('/:groupId/posts/:postId', deleteGroupPost);

// ✅ MEMBERS ROUTES SECOND (more specific - "members" is a literal string)
router.get('/:groupId/members', getGroupMembers);           
router.delete('/:groupId/members/:userId', removeMember);   

// Membership operations (less specific - these match any path)
router.post('/:id/approve-request', approveJoinRequest);
router.post('/:id/reject-request', rejectJoinRequest);
router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);
router.post('/:id/request', requestJoinGroup);
router.post('/:id/cancel-request', cancelJoinRequest);

// CRUD endpoints with :id parameter - KEEP AT VERY BOTTOM (least specific)
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

export default router;