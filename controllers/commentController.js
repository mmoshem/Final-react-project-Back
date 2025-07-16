import Comment from '../models/Comment.js';
import UserInfo from '../models/UserInfo.js';
import mongoose from 'mongoose';

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const { postId, userId, content } = req.body;
    if (!postId || !userId || !content) {
      return res.status(400).json({ message: 'postId, userId, and content are required' });
    }
    const comment = await Comment.create({ postId, userId, content });
    const populated = await Comment.findById(comment._id)
  .populate({
    path: 'userId',
    select: 'first_name last_name profilePicture userId' // Add userId field
  });
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create comment' });
  }
};

// Get all comments for a post (with pagination)
export const getCommentsForPost = async (req, res) => {
  try {
    const { postId, limit = 10, skip = 0 } = req.query;
    if (!postId) return res.status(400).json({ message: 'postId required' });

    const comments = await Comment.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId) } },
      { $sort: { createdAt: -1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'userinfos', // collection name in MongoDB
          localField: 'userId',
          foreignField: 'userId', // join on userId field
          as: 'userInfo'
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          content: 1,
          likes: 1,
          createdAt: 1,
          _id: 1,
          postId: 1,
          comments: 1,
          'userInfo.userId': 1,
          'userInfo.first_name': 1,
          'userInfo.last_name': 1,
          'userInfo.profilePicture': 1
        }
      }
    ]);

    const total = await Comment.countDocuments({ postId });
    res.json({ comments, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

// Get likers for a comment
export const getCommentLikers = async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) return res.status(400).json({ message: 'Invalid commentId' });
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Aggregation: lookup UserInfo by userId in likes array
    const users = await UserInfo.aggregate([
      { $match: { userId: { $in: comment.likes.map(id => new mongoose.Types.ObjectId(id)) } } },
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

// Like/unlike a comment
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body; // This is the User._id
    console.log('Like request for comment:', commentId, 'by userId:', userId);
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    console.log('Before likes:', comment.likes);
    const alreadyLiked = comment.likes.some(id => id.toString() === userId);
    if (alreadyLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      comment.likes.push(userId); // Push User._id
    }
    await comment.save();
    console.log('After likes:', comment.likes);
    res.json({ liked: !alreadyLiked, likeCount: comment.likes.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to like/unlike comment' });
  }
};

// Edit a comment
export const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, content } = req.body;
    if (!userId || !content) return res.status(400).json({ message: 'userId and content required' });
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });
    comment.content = content;
    await comment.save();
  const populated = await Comment.findById(commentId)
  .populate({
    path: 'userId',
    select: 'first_name last_name profilePicture userId' // Add userId field
  });
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to edit comment' });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment' });
  }
}; 