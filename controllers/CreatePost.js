// controllers/CreatePost.js
import Post from "../models/PostModel.js";
import UserInfo from "../models/UserInfo.js";
import cloudinary from '../config/cloudinary.js';
import mongoose, { Types } from 'mongoose';

export const createPost = async (req, res) => {
  try {
    const { userId, content, mediaUrls } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ message: "userId and content are required" });
    }
    const newPost = await Post.create({
      userId,
      content,
      mediaUrls: mediaUrls || null,
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
    // Aggregate posts with user info
    const posts = await Post.aggregate([
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
    const deleted = await Post.deleteOne({ _id: id, userId });
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

