// controllers/CreatePost.js
import Post from "../models/PostModel.js";
import UserInfo from "../models/UserInfo.js";
import cloudinary from '../config/cloudinary.js';
import mongoose, { Types } from 'mongoose';
import Group from "../models/Group.js";

export const createPost = async (req, res) => {
  try {
    const { userId, content, mediaUrls, groupId } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ message: "userId and content are required" });
    }
    const newPost = await Post.create({
      userId,
      content,
      mediaUrls: mediaUrls || null,
      groupId: groupId || null,
      likedBy: [],
      comments: []
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const getAllPosts = async (req, res) => {
  try {

    const {groupid, userid, fillter}=req.params;
    // Aggregate posts with user info
    let posts = [];
    if(groupid==='none'){
      switch(fillter){

        case 'none':
          if (mongoose.Types.ObjectId.isValid(userid)) {
            const userInfo = await UserInfo.findOne({ userId: new mongoose.Types.ObjectId(userid) });

            let followingUsers = [];
            let followingGroups = [];
            if (userInfo) {
              followingUsers = userInfo.followingUsers || [];
              followingGroups = userInfo.followingGroups || [];
            }

            // Build the $or conditions for aggregation
            const orConditions = [
              { userId: new mongoose.Types.ObjectId(userid) }, // your own posts (all)
              { userId: { $in: followingUsers }, groupId: null }, // posts by users you follow, only if not in a group
              { groupId: { $in: followingGroups } } // all posts in groups you follow
            ];

            posts = await Post.aggregate([
              { $match: { $or: orConditions } },
              { $sort: { createdAt: -1 } },
              {
                $lookup: {
                  from: 'userinfos',
                  localField: 'userId',
                  foreignField: 'userId',
                  as: 'userInfo',
                },
              },
              { $unwind: '$userInfo' },
              {
                $lookup: {
                  from: 'groups',
                  localField: 'groupId',
                  foreignField: '_id',
                  as: 'groupInfo',
                },
              },
              {
                $unwind: {
                  path: '$groupInfo',
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $project: {
                  _id: 1,
                  content: 1,
                  createdAt: 1,
                  userId: 1,
                  groupId: 1,
                  mediaUrls: 1,
                  likedBy: 1,
                  comments: 1,
                  profilePicture: '$userInfo.profilePicture',
                  first_name: '$userInfo.first_name',
                  last_name: '$userInfo.last_name',
                  editedAt: 1,
                  groupImage: '$groupInfo.image',
                  groupname: '$groupInfo.name',
                },
              },
            ]);
          } else {
            posts = [];
          }
          break;
        case 'onlyGroupsIFollow':
          let followingGroups = [];
          if (mongoose.Types.ObjectId.isValid(userid)) {
            const userInfo = await UserInfo.findOne({ userId: new mongoose.Types.ObjectId(userid) });
            if (userInfo) {
              followingGroups = userInfo.followingGroups || [];
            }
          }
          if (followingGroups.length > 0) {
            posts = await Post.aggregate([
              { $match: { groupId: { $in: followingGroups } } },
              { $sort: { createdAt: -1 } },
              {
                $lookup: {
                  from: 'userinfos',
                  localField: 'userId',
                  foreignField: 'userId',
                  as: 'userInfo',
                },
              },
              { $unwind: '$userInfo' },
              {
                $lookup: {
                  from: 'groups',
                  localField: 'groupId',
                  foreignField: '_id',
                  as: 'groupInfo',
                },
              },
              {
                $unwind: {
                  path: '$groupInfo',
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $project: {
                  _id: 1,
                  content: 1,
                  createdAt: 1,
                  userId: 1,
                  groupId: 1,
                  mediaUrls: 1,
                  likedBy: 1,
                  comments: 1,
                  profilePicture: '$userInfo.profilePicture',
                  first_name: '$userInfo.first_name',
                  last_name: '$userInfo.last_name',
                  editedAt: 1,
                  groupImage: '$groupInfo.image',
                  groupname: '$groupInfo.name',
                },
              },
            ]);
          } else {
            posts = [];
          }
          break;
        case 'followingUsersPosts':
          let followingUsers = [];
          if (mongoose.Types.ObjectId.isValid(userid)) {
            const userInfo = await UserInfo.findOne({ userId: new mongoose.Types.ObjectId(userid) });
            if (userInfo) {
              followingUsers = userInfo.followingUsers || [];
            }
          }
          if (followingUsers.length > 0) {
            posts = await Post.aggregate([
              { $match: { userId: { $in: followingUsers }, groupId: null } },
              { $sort: { createdAt: -1 } },
              {
                $lookup: {
                  from: 'userinfos',
                  localField: 'userId',
                  foreignField: 'userId',
                  as: 'userInfo',
                },
              },
              { $unwind: '$userInfo' },
              {
                $project: {
                  _id: 1,
                  content: 1,
                  createdAt: 1,
                  userId: 1,
                  groupId: 1,
                  mediaUrls: 1,
                  likedBy: 1,
                  comments: 1,
                  profilePicture: '$userInfo.profilePicture',
                  first_name: '$userInfo.first_name',
                  last_name: '$userInfo.last_name',
                  editedAt: 1,
                },
              },
            ]);
          } else {
            posts = [];
          }
          break;
          default:
            // In this case, fillter is the userId whose posts you want
            let userPosts = [];
            if (mongoose.Types.ObjectId.isValid(fillter)) {
              userPosts = await Post.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(fillter), groupId: null } },
                { $sort: { createdAt: -1 } },
                {
                  $lookup: {
                    from: 'userinfos',
                    localField: 'userId',
                    foreignField: 'userId',
                    as: 'userInfo',
                  },
                },
                { $unwind: '$userInfo' },
                {
                  $project: {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                    userId: 1,
                    groupId: 1,
                    mediaUrls: 1,
                    likedBy: 1,
                    comments: 1,
                    profilePicture: '$userInfo.profilePicture',
                    first_name: '$userInfo.first_name',
                    last_name: '$userInfo.last_name',
                    editedAt: 1,
                  },
                },
              ]);
            } else {
              userPosts = [];
            }
            posts = userPosts;
            break;

      }
    } else {
      // Fetch all posts for the given groupId
      if (mongoose.Types.ObjectId.isValid(groupid)) {
        posts = await Post.aggregate([
          { $match: { groupId: new mongoose.Types.ObjectId(groupid) } },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: 'userinfos',
              localField: 'userId',
              foreignField: 'userId',
              as: 'userInfo',
            },
          },
          { $unwind: '$userInfo' },
          {
            $lookup: {
              from: 'groups',
              localField: 'groupId',
              foreignField: '_id',
              as: 'groupInfo',
            },
          },
          {
            $unwind: {
              path: '$groupInfo',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 1,
              content: 1,
              createdAt: 1,
              userId: 1,
              groupId: 1,
              mediaUrls: 1,
              likedBy: 1,
              comments: 1,
              profilePicture: '$userInfo.profilePicture',
              first_name: '$userInfo.first_name',
              last_name: '$userInfo.last_name',
              editedAt: 1,
              groupImage: '$groupInfo.image',
              groupname: '$groupInfo.name',
            },
          },
        ]);
      } else {
        posts = [];
      }
    }
    res.json(posts);
    
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { postId, userId, content, mediaUrls, removedMediaUrls } = req.body;
    
    if (!postId || !userId || !content) {
      return res.status(400).json({ message: "postId, userId, and content are required" });
    }

    // Check if post exists and belongs to user
    const existingPost = await Post.findOne({ _id: postId, userId });
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found or not authorized" });
    }

    // Delete removed media from Cloudinary if any
    if (Array.isArray(removedMediaUrls) && removedMediaUrls.length > 0) {
      for (const url of removedMediaUrls) {
        const publicId = extractPublicId(url);
        const resourceType = getResourceType(url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
          } catch (err) {
            console.error('Failed to delete media from Cloudinary:', err);
          }
        }
      }
    }

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        content,
        mediaUrls: mediaUrls || [],
        editedAt: new Date()
      },
      { new: true } //return the updated and not the one before the update
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Failed to update post" });
  }
};

// Helper functions for Cloudinary operations
function extractPublicId(url) {
  if (!url) {
      console.warn('extractPublicId: URL is null or empty.');
      return null;
  }
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');

  if (uploadIndex === -1 || parts.length <= uploadIndex + 1) {
      return null; 
  }
  const publicIdStartIndex = uploadIndex + 2;

  if (publicIdStartIndex >= parts.length) {
      return null;
  }

  const publicIdSegments = parts.slice(publicIdStartIndex);
  const publicIdWithExtension = publicIdSegments.join('/');
  const publicId = publicIdWithExtension.split('.')[0]; 
  return publicId;
}

function getResourceType(url) {
  if (!url) return 'image'; // default fallback
  const videoExtensions = ['.mp4', '.webm', '.ogg'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) ? 'video' : 'image';
}

export const deletePost = async (req, res) => {
  console.log('DELETE /api/posts/:id called');
  console.log('req.params:', req.params);
  console.log('req.body:', req.body);

  try {
    const { id } = req.params;
    const { userId, mediaUrls } = req.body;
    if (!id || !userId) {
      return res.status(400).json({ message: 'Post ID and userId are required' });
    }
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    let canDelete = false;
    // Check if the user is the post creator
    if (post.userId.toString() === userId) {
      canDelete = true;
    }
    // If the post is in a group, check if the user is the group creator/admin
    if (post.groupId) {
      const group = await Group.findById(post.groupId);
      if (group && group.creator && group.creator.toString() === userId) {
        canDelete = true;
      }
    }
    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    if (Array.isArray(mediaUrls)) {
      for (const url of mediaUrls) {
        console.log("Attempting to delete media URL:", url);
        const publicId = extractPublicId(url);
        const resourceType = getResourceType(url);
        console.log("Extracted publicId:", publicId, "Resource type:", resourceType);
        try {
          const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
          console.log("Cloudinary destroy result:", result);
        } catch (err) {
          console.error('Failed to delete media from Cloudinary:', err);
        }
      }
    }
    const deleted = await Post.deleteOne({ _id: id });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: 'Post not found or not authorized' });
    }
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

export const likeDislike = async (req, res) => {
  const { userId, postID } = req.body;
  try {
    const post = await Post.findById(postID);
    if (!post) {
      return res.status(404).json("post not found");
    }

    const alreadyLiked = post.likedBy.some(id => id.toString() === userId);

    if (alreadyLiked) {
      await Post.updateOne(
        { _id: postID },
        { $pull: { likedBy: userId } }
      );
      const updated = await Post.findById(postID);
      res.status(200).json({ liked: false, likeCount: updated.likedBy.length });//
    } else {
      await Post.updateOne(
        { _id: postID },
        { $addToSet: { likedBy: userId } }
      );
      const updated = await Post.findById(postID);
      res.status(200).json({ liked: true, likeCount: updated.likedBy.length });
    }
  } catch (error) {
    console.error("Error in likeDislike:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFilteredPosts = async (req, res) => {
  try {
    const { userId, startDate, endDate, contentFilter, includeFriends } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    
    let query = {};
    
    // User filter - include friends if requested
    if (includeFriends === 'true') {
      // Get user's friends list
      const userInfo = await UserInfo.findOne({ userId: userId });
      const friendsIds = userInfo ? userInfo.followingUsers : [];
      
      // Include user's own posts and friends' posts
      query.userId = { $in: [userId, ...friendsIds] };
    } else {
      query.userId = userId;
    }
    
    // Custom date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        const startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
          return res.status(400).json({ message: "Invalid startDate format. Use YYYY-MM-DD" });
        }
        query.createdAt.$gte = startDateObj;
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate);
        if (isNaN(endDateObj.getTime())) {
          return res.status(400).json({ message: "Invalid endDate format. Use YYYY-MM-DD" });
        }
        query.createdAt.$lte = endDateObj;
      }
      
      // Validate that startDate is before endDate
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ message: "startDate must be before endDate" });
      }
    }
    
    // Content-based filtering
    if (contentFilter === 'media') {
      query.mediaUrls = { $exists: true, $ne: [] };
    } else if (contentFilter === 'text') {
      query.$or = [
        { mediaUrls: { $exists: false } },
        { mediaUrls: [] }
      ];
    }
    
    // Aggregate posts with user info (same as getAllPosts)
    const posts = await Post.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'userinfos',
          localField: 'userId',
          foreignField: 'userId',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          content: 1,
          createdAt: 1,
          userId: 1,
          mediaUrls: 1,
          likedBy: 1,
          comments: 1,
          profilePicture: '$userInfo.profilePicture',
          first_name: '$userInfo.first_name',
          last_name: '$userInfo.last_name',
          editedAt: 1, 
        },
      },
    ]);
    
    res.json(posts);
    
  } catch (error) {
    console.error("Error fetching filtered posts:", error);
    res.status(500).json({ message: "Failed to fetch filtered posts" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    
    // Simple direct query to get user's posts
    const posts = await Post.find({ userId: userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'first_name last_name profilePicture');
    
    res.json(posts);
    
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
};

// Get likers for a post
export const getPostLikers = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ message: 'Invalid postId' });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Defensive: if no likes, return empty array
    if (!post.likedBy || post.likedBy.length === 0) {
      return res.json([]);
    }
    // Only use valid ObjectIds
    const likerIds = post.likedBy
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    if (likerIds.length === 0) return res.json([]);

    // Aggregation: lookup UserInfo by userId in likedBy array
    const users = await UserInfo.aggregate([
      { $match: { userId: { $in: likerIds } } },
      {
        $project: {
          _id: 0, // do not return _id
          userId: 1,
          first_name: 1,
          last_name: 1,
          profilePicture: 1
        }
      }
    ]);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch likers' });
  }
};

