import Group from '../models/GroupModel.js';
import Post from '../models/PostModel.js';

export const getGroupPosts = async (req, res) => {
  const { groupId } = req.params;
  try {
    const posts = await Post.aggregate([
      { $match: { groupId: groupId } },
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
    console.error('Error fetching group posts:', error);
    res.status(500).json({ message: 'Failed to get group posts' });
  }
};
