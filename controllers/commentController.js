import Comment from '../models/Comment.js';
import UserInfo from '../models/UserInfo.js';
import mongoose from 'mongoose';


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
    select: 'first_name last_name profilePicture userId' 
  });
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create comment' });
  }
};


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
          from: 'userinfos', 
          localField: 'userId',
          foreignField: 'userId', 
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

export const getCommentLikers = async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) return res.status(400).json({ message: 'Invalid commentId' });
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    //lookup UserInfo by userId in likes array
    const users = await UserInfo.aggregate([
      { $match: { userId: { $in: comment.likes.map(id => new mongoose.Types.ObjectId(id)) } } },
      {
        $project: {
          _id: 0, 
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
    const { userId } = req.body; 

    if (!userId) return res.status(400).json({ message: 'userId required' });
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const alreadyLiked = comment.likes.some(id => id.toString() === userId);
    if (alreadyLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      comment.likes.push(userId); 
    }
    await comment.save();

    res.json({ liked: !alreadyLiked, likeCount: comment.likes.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to like/unlike comment' });
  }
};


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
    select: 'first_name last_name profilePicture userId' 
  });
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to edit comment' });
  }
};


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