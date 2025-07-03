import Post from "../models/PostModel.js";
import cloudinary from '../config/cloudinary.js';

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
      likes: 0,
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
          likes: 1,
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
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

export const deletePost = async (req, res) => {
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
  try {
    const { id } = req.params;
    const { userId, mediaUrls } = req.body;
    if (!id || !userId) {
      return res.status(400).json({ message: 'Post ID and userId are required' });
    }
    // Delete media from Cloudinary if mediaUrls are provided
    if (Array.isArray(mediaUrls)) {
      for (const url of mediaUrls) {
        console.log("url:", url);
        const publicId = extractPublicId(url);
        try {
          await cloudinary.uploader.destroy(publicId);
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