import profileUploadController from '../controllers/profileUploadController.js';
import { getGroupAnalytics } from '../controllers/GroupAnalyticsController.js';
import express from 'express';
import cloudinary from '../config/cloudinary.js';
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
    getGroupMembers,
    removeMember
    
} from '../controllers/GroupMemberController.js';
import {
    getGroupPosts,
    createGroupPost,
    deleteGroupPost
} from '../controllers/GroupPostController.js';

const router = express.Router();

// Log all requests to this router
router.use((req, res, next) => {
    console.log('🔥 GROUP ROUTER REQUEST:', req.method, req.originalUrl);
    next();
});

// Test route
router.get('/test', (req, res) => {
    console.log('🧪 Test route hit!');
    res.json({ message: '✅ Test route working!' });
});

// Test Cloudinary deletion
router.get('/test-delete/:publicId', async (req, res) => {
    try {
        const publicId = req.params.publicId.replace('--', '/');
        console.log('🧪 Testing deletion of:', publicId);
        
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('🧪 Cloudinary result:', result);
        
        res.json({ success: true, result, publicId });
    } catch (error) {
        console.error('🧪 Cloudinary error:', error);
        res.json({ success: false, error: error.message });
    }
});

// Search route
router.get('/search', searchGroups);

router.get('/:groupId/analytics', getGroupAnalytics);


// Upload route
router.post('/upload-group-picture',
    profileUploadController.profileUploadMiddleware,
    profileUploadController.uploadProfilePicture
);

// Creator/member routes
router.get('/creator/:userId', getGroupsByCreator);
router.get('/member/:userId', getGroupsByMember);

// Root routes
router.get('/', getAllGroups);
router.post('/', createGroup);

// Posts routes
router.get('/:groupId/posts', getGroupPosts);
router.post('/:groupId/posts', createGroupPost);
router.delete('/:groupId/posts/:postId', deleteGroupPost);

// Members routes
router.get('/:groupId/members', getGroupMembers);
router.delete('/:groupId/members/:userId', removeMember);

// Membership operations
router.post('/:id/approve-request', approveJoinRequest);
router.post('/:id/reject-request', rejectJoinRequest);
router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);
router.post('/:id/request', requestJoinGroup);
router.post('/:id/cancel-request', cancelJoinRequest);

// CRUD endpoints
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', (req, res, next) => {
    console.log('🚨 DELETE ROUTE HIT! Params:', req.params);
    console.log('🚨 Calling deleteGroup function...');
    deleteGroup(req, res, next);
});

export default router;